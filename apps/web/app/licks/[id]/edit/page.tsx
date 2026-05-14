import { LickEditorPage } from "../../components/LickEditorPage";

type EditLickPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditLickPage({ params }: EditLickPageProps) {
  const { id } = await params;

  return <LickEditorPage lickId={id} />;
}
