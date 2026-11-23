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

type RouteContext = { params: Promise<{ id: string }> }

function isMissingUnit(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025"
}

async function getUnitId(context: RouteContext) {
  const { id } = await context.params
  const decodedId = decodeURIComponent(id).trim()
  if (!/^\d+$/.test(decodedId)) return null

  const parsedId = Number(decodedId)
  return Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : null
}

function parseFacilityCodes(value: unknown): string[] | null | "invalid" {
  if (value === undefined) return null
  if (!Array.isArray(value)) return "invalid"

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)

  return Array.from(new Set(normalized))
}

function extractFacilityCodes(
  relation:
    | { kode: string; tbl_facility?: { kode: string; nama: string } }
    | Array<{ kode: string; tbl_facility?: { kode: string; nama: string } }>
    | null
    | undefined
): string[] {
  if (!relation) return []
  if (Array.isArray(relation)) {
    return relation.map((item) => item.kode)
  }
  return relation.kode ? [relation.kode] : []
}

function extractFacilities(
  relation:
    | { kode: string; tbl_facility?: { kode: string; nama: string } }
    | Array<{ kode: string; tbl_facility?: { kode: string; nama: string } }>
    | null
    | undefined
): Array<{ kode: string; nama: string }> {
  if (!relation) return []
  const items = Array.isArray(relation) ? relation : [relation]
  return items
    .map((item) => item.tbl_facility)
    .filter((fac): fac is { kode: string; nama: string } => Boolean(fac))
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const unitId = await getUnitId(context)
  if (!unitId) {
    return NextResponse.json({ error: "ID tipe unit tidak valid." }, { status: 400 })
  }

  try {
    const unitItem = await prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        ...unitFields,
        tbl_type_unit_facility: {
          select: {
            kode: true,
            tbl_facility: {
              select: {
                kode: true,
                nama: true,
              },
            },
          },
        },
      },
    })

    if (!unitItem) {
      return NextResponse.json({ error: "Tipe unit tidak ditemukan." }, { status: 404 })
    }

    const { tbl_type_unit_facility, ...baseUnit } = unitItem
    const facilityCodes = extractFacilityCodes(tbl_type_unit_facility)
    const facilities = extractFacilities(tbl_type_unit_facility)

    return NextResponse.json({
      item: {
        ...baseUnit,
        idUnitType: baseUnit.id,
        namaTypeUnit: baseUnit.nama,
        branchId: baseUnit.branch,
        facilityCodes,
        facilities,
      },
    })
  } catch (error) {
    console.error("Failed to fetch unit:", error)
    return NextResponse.json({ error: "Gagal memuat data tipe unit." }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const unitId = await getUnitId(context)
  if (!unitId) {
    return NextResponse.json({ error: "ID tipe unit tidak valid." }, { status: 400 })
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
    return NextResponse.json({ error: "Branch tidak valid." }, { status: 400 })
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existingUnit = await tx.unit.findUnique({
        where: { id: unitId },
        select: { id: true },
      })

      if (!existingUnit) {
        return null
      }

      if (parsedFacilityCodes !== null) {
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

        await tx.type_unit_facility.deleteMany({
          where: { id: unitId },
        })

        if (parsedFacilityCodes.length > 0) {
          await tx.type_unit_facility.createMany({
            data: parsedFacilityCodes.map((kode) => ({
              id: unitId,
              kode,
            })),
            skipDuplicates: true,
          })
        }
      }

      const unitUpdated = await tx.unit.update({
        where: { id: unitId },
        data: {
          nama,
          branch: rawBranch,
        },
        select: {
          ...unitFields,
          tbl_type_unit_facility: {
            select: {
              kode: true,
              tbl_facility: {
                select: {
                  kode: true,
                  nama: true,
                },
              },
            },
          },
        },
      })

      const { tbl_type_unit_facility, ...baseUnit } = unitUpdated
      return {
        ...baseUnit,
        idUnitType: baseUnit.id,
        namaTypeUnit: baseUnit.nama,
        branchId: baseUnit.branch,
        facilityCodes: extractFacilityCodes(tbl_type_unit_facility),
        facilities: extractFacilities(tbl_type_unit_facility),
      }
    })

    if (!updated) {
      return NextResponse.json({ error: "Tipe unit tidak ditemukan." }, { status: 404 })
    }

    return NextResponse.json({ item: updated })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_FACILITY_CODES:")) {
      const codes = error.message.replace("INVALID_FACILITY_CODES:", "")
      return NextResponse.json(
        { error: `Kode fasilitas tidak ditemukan: ${codes}` },
        { status: 400 }
      )
    }
    if (isMissingUnit(error)) {
      return NextResponse.json({ error: "Tipe unit tidak ditemukan." }, { status: 404 })
    }
    console.error("Failed to update unit:", error)
    return NextResponse.json(
      { error: "Gagal memperbarui tipe unit. Periksa koneksi database." },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const unitId = await getUnitId(context)
  if (!unitId) {
    return NextResponse.json({ error: "ID tipe unit tidak valid." }, { status: 400 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.type_unit_facility.deleteMany({
        where: { id: unitId },
      })
      await tx.unit.delete({
        where: { id: unitId },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (isMissingUnit(error)) {
      return NextResponse.json({ error: "Tipe unit tidak ditemukan." }, { status: 404 })
    }
    console.error("Failed to delete unit:", error)
    return NextResponse.json({ error: "Gagal menghapus tipe unit." }, { status: 400 })
  }
}