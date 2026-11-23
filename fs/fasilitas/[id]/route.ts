import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const fasilitasFields = {
  kode: true,
  nama: true,
  createdAt: true,
  updatedAt: true,
} as const

type RouteContext = { params: Promise<{ kode: string }> }

function isMissingfasilitas(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025"
}

async function getfasilitasKode(context: RouteContext) {
  const { kode } = await context.params
  const decodedKode = decodeURIComponent(kode).trim()
  return decodedKode.length > 0 ? decodedKode : null
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAuthenticatedUser())) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const fasilitasKode = await getfasilitasKode(context)
  if (!fasilitasKode) {
    return NextResponse.json({ error: "Kode fasilitas tidak valid." }, { status: 400 })
  }

  try {
    const fasilitas = await prisma.facility.findUnique({
      where: { kode: fasilitasKode },
      select: fasilitasFields,
    })
    if (!fasilitas) {
      return NextResponse.json({ error: "fasilitas tidak ditemukan." }, { status: 404 })
    }

    return NextResponse.json({ item: fasilitas })
  } catch (error) {
    console.error("Failed to fetch fasilitas:", error)
    return NextResponse.json({ error: "Gagal memuat data fasilitas." }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const fasilitasKode = await getfasilitasKode(context)
  if (!fasilitasKode) {
    return NextResponse.json({ error: "Kode fasilitas tidak valid." }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid." }, { status: 400 })
  }

  const nama = typeof body.nama === "string" ? body.nama.trim() : ""

  if (!nama || nama.length > 191) {
    return NextResponse.json({ error: "Nama fasilitas tidak valid." }, { status: 400 })
  }

  try {
    const updated = await prisma.facility.update({
      where: { kode: fasilitasKode },
      data: {
        nama,
      },
      select: fasilitasFields,
    })
    return NextResponse.json({ item: updated })
  } catch (error) {
    if (isMissingfasilitas(error)) {
      return NextResponse.json({ error: "fasilitas tidak ditemukan." }, { status: 404 })
    }
    console.error("Failed to update fasilitas:", error)
    return NextResponse.json(
      { error: "Gagal memperbarui fasilitas. Periksa koneksi database." },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const fasilitasKode = await getfasilitasKode(context)
  if (!fasilitasKode) {
    return NextResponse.json({ error: "Kode fasilitas tidak valid." }, { status: 400 })
  }

  try {
    await prisma.facility.delete({ where: { kode: fasilitasKode } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isMissingfasilitas(error)) {
      return NextResponse.json({ error: "fasilitas tidak ditemukan." }, { status: 404 })
    }
    console.error("Failed to delete fasilitas:", error)
    return NextResponse.json({ error: "Gagal menghapus fasilitas." }, { status: 500 })
  }
}
