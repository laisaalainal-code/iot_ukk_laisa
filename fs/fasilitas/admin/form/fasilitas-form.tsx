'use client'
 
import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
 
type FasilitasFormFasilitas = {
    kode: string | null
    nama: string,
    createdAt: string,
    updatedAt: string,
}
 
type FasilitasFormProps = {
  fasilitasKode?: string
}
 
export function FasilitasForm({ fasilitasKode }: FasilitasFormProps) {
  const router = useRouter()
  const [fasilitas, setFasilitas] = useState<FasilitasFormFasilitas| null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(fasilitasKode))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [nama, setNama] = useState("")
 
 
  useEffect(() => {
    if (!fasilitasKode) return
 
    let isActive = true
    async function loadFasilitas() {
      try {
        const response = await fetch(`/api/fasilitas/${fasilitasKode}`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? "Gagal memuat Fasilitas.")
 
       const data = result.item ?? result.fasilitas
        if (isActive && data) {
          setFasilitas(data)
          setNama(data.nama ?? "")
          
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat Fasilitas.")
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
 
    void loadFasilitas()
    return () => {
      isActive = false
    }
  }, [fasilitasKode])
 
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError("")
    try {
      const response = await fetch(fasilitasKode ? `/api/fasilitas/${fasilitasKode}` : "/api/fasilitas", {
        method: fasilitasKode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
         
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Gagal menyimpan Fasilitas.")
      router.push("/admin/fasilitas")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan Fasilitas.")
    } finally {
      setIsSaving(false)
    }
  }
 
  return (
    <Card className="m-6 px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{fasilitasKode ? "Edit Fasilitas" : "Tambah Fasilitas"}</h1>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/fasilitas")}>
          <ArrowLeft aria-hidden="true" />
          Kembali
        </Button>
      </div>
 
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <p className="mt-5 text-sm text-muted-foreground">Memuat Fasilitas...</p>
      ) : fasilitasKode && !fasilitas ? null : (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 rounded-md border p-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="nama" className="text-sm font-medium">Nama Fasilitas</label>
            <Input id="nama" value={nama} onChange={(event) => setNama(event.target.value)} required maxLength={191} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/Fasilitas")} disabled={isSaving}>
              <X aria-hidden="true" />
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : fasilitas ? "Simpan perubahan" : "Buat Fasilitas"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}