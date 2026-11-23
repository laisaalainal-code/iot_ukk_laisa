import { NextResponse } from "next/server"
import { Prisma } from "@/src/generated/prisma/client"
import { getAuthenticatedUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const fasilitasFields = {
  kode: true,
  nama: true,
  createdAt: true,
  updatedAt: true,
} as const

// =========================================================================
// PEMBUATAN AUTO NUMBER DI BACKEND (API)
// Mencari kode terakhir di database, mengambil angkanya, lalu + 1
// =========================================================================
async function generateKodeFasilitas(tx: Prisma.TransactionClient) {
  const prefix = "FST"

  const lastFasilitas = await tx.facility.findFirst({
    where: {
      kode: { startsWith: prefix },
    },
    orderBy: {
      kode: "desc",
    },
    select: { kode: true },
  })

  if (!lastFasilitas || !lastFasilitas.kode) {
    return `${prefix}0000001`
  }

  const numericPart = lastFasilitas.kode.slice(prefix.length)
  const lastNumber = Number.parseInt(numericPart, 10)
  const nextNumber = Number.isNaN(lastNumber) ? 1 : lastNumber + 1

  return `${prefix}${String(nextNumber).padStart(7, "0")}`
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
    const totalFasilitas = await prisma.facility.count()
    const totalPages = Math.max(1, Math.ceil(totalFasilitas / pageSize))
    const page =
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.min(requestedPage, totalPages)
        : 1

    const fasilitas = await prisma.facility.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: fasilitasFields,
    })

    return NextResponse.json({
      items: fasilitas,
      pagination: { page, pageSize, totalFasilitas, totalPages },
    })
  } catch (error) {
    console.error("Failed to fetch fasilitas:", error)
    return NextResponse.json(
      { error: "Gagal memuat data fasilitas." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid." }, { status: 400 })
  }

  const nama = typeof body.nama === "string" ? body.nama.trim() : ""

  if (!nama || nama.length > 191) {
    return NextResponse.json(
      { error: "Nama fasilitas wajib diisi dan maksimal 191 karakter." },
      { status: 400 }
    )
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const kode = await generateKodeFasilitas(tx)

      return tx.facility.create({
        data: {
          kode,
          nama,
        },
        select: fasilitasFields,
      })
    })

    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    console.error("Failed to create fasilitas:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan data fasilitas." },
      { status: 500 }
    )
  }
}