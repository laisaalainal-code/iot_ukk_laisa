'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Printer, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

type ManagedTipeUnit = {
    idUnitType: number
    namaTypeUnit: string
    branchId: number
    createdAt: string
    updatedAt?: string
}

const PAGE_SIZE = 10

export default function TipeUnitPage() {
    const router = useRouter()
    const [tipeUnitList, setTipeUnitList] = useState<ManagedTipeUnit[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalTipeUnit, setTotalTipeUnit] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    const tanggalCetak = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })

    async function loadTipeUnit(page = currentPage) {
        setIsLoading(true)
        setError("")
        try {
            const response = await fetch(`/api/tipe_unit?page=${page}&pageSize=${PAGE_SIZE}`)
            const result = await response.json()
            if (!response.ok) throw new Error(result.error ?? "Gagal memuat Tipe Unit.")

            const rawItems: Array<Record<string, unknown>> = result.tipeUnit ?? result.items ?? []
            const items: ManagedTipeUnit[] = rawItems.map((item) => ({
                idUnitType: Number(item.idUnitType ?? item.id ?? 0),
                namaTypeUnit: String(item.namaTypeUnit ?? item.nama ?? ""),
                branchId: Number(item.branchId ?? item.branch ?? 0),
                createdAt: String(item.createdAt ?? ""),
                updatedAt: item.updatedAt ? String(item.updatedAt) : undefined,
            }))
            const total: number =
                result.pagination?.totalTipeUnit ??
                result.pagination?.totalUnit ??
                result.pagination?.totalItems ??
                items.length
            const nextPage: number = result.pagination?.page ?? page

            setTipeUnitList(items)
            setTotalTipeUnit(total)
            setCurrentPage(nextPage)
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Gagal memuat Tipe Unit.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void loadTipeUnit(1)
    }, [])

    function goToPage(page: number) {
        setCurrentPage(page)
        void loadTipeUnit(page)
    }

    async function deleteTipeUnit(item: ManagedTipeUnit) {
        if (!window.confirm(`Hapus Tipe Unit ${item.namaTypeUnit}?`)) return
        setError("")
        try {
            const response = await fetch(`/api/tipe_unit/${item.idUnitType}`, { method: "DELETE" })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error ?? "Gagal menghapus Tipe Unit.")

            if (tipeUnitList.length === 1 && currentPage > 1) {
                goToPage(currentPage - 1)
            } else {
                await loadTipeUnit(currentPage)
            }
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus Tipe Unit.")
        }
    }

    function handlePrint() {
        window.print()
    }

    const totalPages = Math.max(1, Math.ceil(totalTipeUnit / PAGE_SIZE))

    return (
        <Card className="print-card m-6 px-4">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 15mm;
                    }
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-card {
                        border: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                }
            `}</style>

            {/* KOP SURAT + LOGO */}
            <div className="hidden border-b-4 border-double border-black pb-4 text-black print:block">
                <div className="flex items-center gap-4">
                    <img
                        src="/mvp.jpg"
                        alt="Logo SMK MVP ARS Internasional"
                        className="h-16 w-16 object-contain"
                    />
                    <div className="flex-1 text-center">
                        <p className="text-sm font-semibold uppercase tracking-wide">
                            YAYASAN GRAHA BINA PENDIDIKAN INTERNASIONAL
                        </p>
                        <h2 className="text-xl font-bold uppercase">
                            SMKS MVP ARS INTERNASIONAL
                        </h2>
                        <p className="text-xs">
                            Jl. Sekolah Internasional No. 1-6, Cicaheum, Kec. Kiaracondong, Kota Bandung, Jawa Barat • Telp: (022) 7210719
                        </p>
                    </div>
                </div>
            </div>

            {/* JUDUL LAPORAN */}
            <div className="mt-4 hidden text-center text-black print:block">
                <h3 className="text-base font-bold uppercase underline">LAPORAN DATA TIPE UNIT</h3>
                <p className="mt-1 text-xs">Tanggal Cetak: {tanggalCetak}</p>
            </div>

            {/* HEADER HALAMAN NORMAL */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="mb-1 text-2xl font-bold">Tipe Unit</h1>
                    <p className="text-sm text-muted-foreground">Kelola Tipe Unit & Cetak Laporan</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={handlePrint}>
                        <Printer aria-hidden="true" />
                        Cetak laporan
                    </Button>
                    <Button type="button" onClick={() => router.push("/admin/tipe_unit/form/add")}>
                        <Plus aria-hidden="true" />
                        Tambah Tipe Unit
                    </Button>
                </div>
            </div>

            {error && <p role="alert" className="no-print mt-4 text-sm text-destructive">{error}</p>}

            <div className="mt-5 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Tipe Unit</TableHead>
                            <TableHead>Nama Tipe Unit</TableHead>
                            <TableHead>Branch ID</TableHead>
                            <TableHead>Dibuat</TableHead>
                            <TableHead className="no-print text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Memuat Tipe Unit...</TableCell>
                            </TableRow>
                        ) : tipeUnitList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Belum ada Tipe Unit.</TableCell>
                            </TableRow>
                        ) : tipeUnitList.map((item) => (
                            <TableRow key={item.idUnitType}>
                                <TableCell className="font-medium">{item.idUnitType}</TableCell>
                                <TableCell className="font-medium">{item.namaTypeUnit}</TableCell>
                                <TableCell>{item.branchId}</TableCell>
                                <TableCell>{new Date(item.createdAt).toLocaleDateString("id-ID")}</TableCell>
                                <TableCell className="no-print">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Edit ${item.namaTypeUnit}`}
                                            title="Edit Tipe Unit"
                                            onClick={() => router.push(`/admin/tipe_unit/form/${item.idUnitType}`)}
                                        >
                                            <Pencil aria-hidden="true" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Hapus ${item.namaTypeUnit}`}
                                            title="Hapus Tipe Unit"
                                            onClick={() => void deleteTipeUnit(item)}
                                        >
                                            <Trash2 aria-hidden="true" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* TANDA TANGAN SAAT PRINT */}
            <div className="mt-8 hidden justify-end text-sm text-black print:flex">
                <div className="w-56 text-center">
                    <p>Rancaekek, {tanggalCetak}</p>
                    <p className="mt-1">Petugas / Administrator,</p>
                    <div className="h-16" />
                    <p className="font-semibold underline">( ______________________ )</p>
                </div>
            </div>

            {/* PAGINATION */}
            <div className="no-print mt-5 flex flex-wrap items-center justify-between gap-3">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                aria-disabled={currentPage === 1 || isLoading}
                                className={currentPage === 1 || isLoading ? "pointer-events-none opacity-50" : undefined}
                                onClick={(event) => {
                                    event.preventDefault()
                                    if (currentPage > 1 && !isLoading) goToPage(currentPage - 1)
                                }}
                            />
                        </PaginationItem>
                        {getPageItems(currentPage, totalPages).map((pageItem, index) => (
                            <PaginationItem key={`${pageItem}-${index}`}>
                                {pageItem === "ellipsis" ? (
                                    <PaginationEllipsis />
                                ) : (
                                    <PaginationLink
                                        href="#"
                                        isActive={pageItem === currentPage}
                                        aria-label={`Go to page ${pageItem}`}
                                        onClick={(event) => {
                                            event.preventDefault()
                                            if (!isLoading && pageItem !== currentPage) goToPage(pageItem)
                                        }}
                                    >
                                        {pageItem}
                                    </PaginationLink>
                                )}
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                aria-disabled={currentPage === totalPages || isLoading}
                                className={currentPage === totalPages || isLoading ? "pointer-events-none opacity-50" : undefined}
                                onClick={(event) => {
                                    event.preventDefault()
                                    if (currentPage < totalPages && !isLoading) goToPage(currentPage + 1)
                                }}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </Card>
    )
}

function getPageItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
    if (totalPages <= 4) {
        return Array.from({ length: totalPages }, (_, index) => index + 1)
    }
    if (currentPage <= 2) return [1, 2, 3, "ellipsis"]
    if (currentPage >= totalPages - 1) {
        return ["ellipsis", totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis"]
}