'use client'

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type FacilityOption = {
  kode: string
  nama: string
}

type TipeUnitFormData = {
  idUnitType?: number
  id?: number
  namaTypeUnit?: string
  nama?: string
  branchId?: number
  branch?: number
  facilityCodes?: string[]
  createdAt?: string
  updatedAt?: string
}

type TipeUnitFormProps = {
  tipeUnitId?: string
}

export function TipeUnitForm({ tipeUnitId }: TipeUnitFormProps) {
  const router = useRouter()
  const [tipeUnit, setTipeUnit] = useState<TipeUnitFormData | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(tipeUnitId))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [namaTypeUnit, setNamaTypeUnit] = useState("")
  const [branchId, setBranchId] = useState("")
  const [facilities, setFacilities] = useState<FacilityOption[]>([])
  const [selectedFacilityCodes, setSelectedFacilityCodes] = useState<string[]>([])

  useEffect(() => {
    let isActive = true
    async function loadFacilities() {
      try {
        const response = await fetch("/api/fasilitas")
        if (!response.ok) return
        const result = await response.json()
        const rawList = result.items ?? result.fasilitas ?? result.facilities ?? []
        if (isActive && Array.isArray(rawList)) {
          const mapped = rawList
            .map((item: Record<string, unknown>) => ({
              kode: String(item.kode ?? item.kode_facility ?? ""),
              nama: String(item.nama ?? ""),
            }))
            .filter((item) => item.kode)
          setFacilities(mapped)
        }
      } catch {
        // Abaikan jika endpoint fasilitas belum tersedia
      }
    }

    void loadFacilities()
    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!tipeUnitId) return

    let isActive = true
    async function loadTipeUnit() {
      try {
        const response = await fetch(`/api/tipe_unit/${tipeUnitId}`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? "Gagal memuat Tipe Unit.")

        const data = result.item ?? result.tipeUnit
        if (isActive && data) {
          setTipeUnit(data)
          setNamaTypeUnit(data.namaTypeUnit ?? data.nama ?? "")
          const resolvedBranch = data.branchId ?? data.branch
          setBranchId(resolvedBranch !== undefined && resolvedBranch !== null ? String(resolvedBranch) : "")
          setSelectedFacilityCodes(Array.isArray(data.facilityCodes) ? data.facilityCodes : [])
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat Tipe Unit.")
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadTipeUnit()
    return () => {
      isActive = false
    }
  }, [tipeUnitId])

  function toggleFacility(kode: string) {
    setSelectedFacilityCodes((prev) =>
      prev.includes(kode) ? prev.filter((item) => item !== kode) : [...prev, kode]
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError("")

    const parsedBranchId = Number(branchId)
    if (!Number.isInteger(parsedBranchId) || parsedBranchId <= 0) {
      setError("Branch ID harus berupa angka bulat yang valid.")
      setIsSaving(false)
      return
    }

    try {
      const response = await fetch(
        tipeUnitId ? `/api/tipe_unit/${tipeUnitId}` : "/api/tipe_unit",
        {
          method: tipeUnitId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            namaTypeUnit: namaTypeUnit.trim(),
            branchId: parsedBranchId,
            nama: namaTypeUnit.trim(),
            branch: parsedBranchId,
            facilityCodes: selectedFacilityCodes,
          }),
        }
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Gagal menyimpan Tipe Unit.")
      router.push("/admin/tipe_unit")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan Tipe Unit.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="m-6 px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{tipeUnitId ? "Edit Tipe Unit" : "Tambah Tipe Unit"}</h1>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/tipe_unit")}>
          <ArrowLeft aria-hidden="true" />
          Kembali
        </Button>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <p className="mt-5 text-sm text-muted-foreground">Memuat Tipe Unit...</p>
      ) : tipeUnitId && !tipeUnit ? null : (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 rounded-md border p-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="namaTypeUnit" className="text-sm font-medium">Nama Tipe Unit</label>
            <Input
              id="namaTypeUnit"
              value={namaTypeUnit}
              onChange={(event) => setNamaTypeUnit(event.target.value)}
              required
              maxLength={191}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="branchId" className="text-sm font-medium">Branch ID</label>
            <Input
              id="branchId"
              type="number"
              min={1}
              step={1}
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              required
            />
          </div>

          {facilities.length > 0 && (
            <div className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Fasilitas</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {facilities.map((facility) => {
                  const checked = selectedFacilityCodes.includes(facility.kode)
                  return (
                    <label
                      key={facility.kode}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFacility(facility.kode)}
                      />
                      <span>
                        {facility.nama} ({facility.kode})
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/tipe_unit")}
              disabled={isSaving}
            >
              <X aria-hidden="true" />
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : tipeUnit ? "Simpan perubahan" : "Buat Tipe Unit"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}