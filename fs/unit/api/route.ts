import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const unitFields = {
  id: true,
  nama: true,
  branch: true,
  createdAt: true,
  updatedAt: true,
} as const

function parseFacilityCodes(value: unknown): string[] | "invalid" {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) return "invalid"

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)

  return Array.from(new Set(normalized))
}

export async function GET(request: Request) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json(
      { error: "Silakan login untuk melanjutkan." },
      { status: 401 }
    )
  }

  const searchParams = new URL(request.url).searchParams
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10)
  const requestedPageSize = Number.parseInt(
    searchParams.get("pageSize") ?? "10",
    10
  )
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(100, Math.max(1, requestedPageSize))
    : 10

  try {
    const totalUnit = await prisma.unit.count()
    const totalPages = Math.max(1, Math.ceil(totalUnit / pageSize))
    const page =
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.min(requestedPage, totalPages)
        : 1

    const rawItems = await prisma.unit.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: unitFields,
    })

    const items = rawItems.map((item) => ({
      ...item,
      idUnitType: item.id,
      namaTypeUnit: item.nama,
      branchId: item.branch,
    }))

    return NextResponse.json({
      items,
      pagination: { page, pageSize, totalUnit, totalPages },
    })
  } catch (error) {
    console.error("Failed to fetch unit:", error)
    return NextResponse.json(
      { error: "Gagal memuat data tipe unit." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json(
      { error: "Silakan login untuk melanjutkan." },
      { status: 401 }
    )
  }

  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid." }, { status: 400 })
  }

  const rawNama =
    typeof body.nama === "string"
      ? body.nama
      : typeof body.namaTypeUnit === "string"
        ? body.namaTypeUnit
        : ""
  const nama = rawNama.trim()

  const rawBranchInput = body.branch !== undefined ? body.branch : body.branchId
  const rawBranch =
    rawBranchInput === undefined || rawBranchInput === null || rawBranchInput === ""
      ? 0
      : typeof rawBranchInput === "number"
        ? rawBranchInput
        : Number(rawBranchInput)

  const parsedFacilityCodes = parseFacilityCodes(body.facilityCodes)
  if (parsedFacilityCodes === "invalid") {
    return NextResponse.json({ error: "Format facilityCodes tidak valid." }, { status: 400 })
  }

  if (!nama || nama.length > 191) {
    return NextResponse.json(
      { error: "Nama tipe unit wajib diisi dan maksimal 191 karakter." },
      { status: 400 }
    )
  }

  if (!Number.isInteger(rawBranch) || rawBranch < 0) {
    return NextResponse.json(
      { error: "Branch harus berupa angka bulat 0 atau lebih." },
      { status: 400 }
    )
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      if (parsedFacilityCodes.length > 0) {
        const validFacilities = await tx.facility.findMany({
          where: { kode: { in: parsedFacilityCodes } },
          select: { kode: true },
        })
        const validSet = new Set(validFacilities.map((f) => f.kode))
        const invalidCodes = parsedFacilityCodes.filter((code) => !validSet.has(code))

        if (invalidCodes.length > 0) {
          throw new Error(`INVALID_FACILITY_CODES:${invalidCodes.join(",")}`)
        }
      }

      const newUnit = await tx.unit.create({
        data: {
          nama,
          branch: rawBranch,
        },
        select: unitFields,
      })

      if (parsedFacilityCodes.length > 0) {
        await tx.type_unit_facility.createMany({
          data: parsedFacilityCodes.map((kode) => ({
            id: newUnit.id,
            kode,
          })),
          skipDuplicates: true,
        })
      }

      return {
        ...newUnit,
        idUnitType: newUnit.id,
        namaTypeUnit: newUnit.nama,
        branchId: newUnit.branch,
        facilityCodes: parsedFacilityCodes,
      }
    })

    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_FACILITY_CODES:")) {
      const codes = error.message.replace("INVALID_FACILITY_CODES:", "")
      return NextResponse.json(
        { error: `Kode fasilitas tidak ditemukan: ${codes}` },
        { status: 400 }
      )
    }
    console.error("Failed to create unit:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan data tipe unit." },
      { status: 500 }
    )
  }
}