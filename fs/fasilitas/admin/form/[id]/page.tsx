import { FasilitasForm } from "../fasilitas-form";

type EditFasilitasPageProps = {
  params: Promise<{ kode: string }>;
};

export const instant = false;

export default async function EditFasilitasPage({ params }: EditFasilitasPageProps) {
  const { kode } = await params;

  return <FasilitasForm fasilitasKode={kode} />;
}
