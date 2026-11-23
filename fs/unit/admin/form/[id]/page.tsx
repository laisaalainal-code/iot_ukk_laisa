import { TipeUnitForm } from "../tipe_unit-form";

type EditTipeUnitPageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export default async function EditTipeUnitPage({ params }: EditTipeUnitPageProps) {
  const { id } = await params;

  return <TipeUnitForm tipeUnitId={id} />;
}