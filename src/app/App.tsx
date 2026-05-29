import { BrowserRouter, Route, Routes, useParams } from "react-router";
import { createSampleSchedule, longTextSchedule, missingPortraitSchedule } from "../data/mockSchedule";
import { EditorShell } from "../components/editor/EditorShell";

function SampleRoute() {
  const params = useParams();
  const sampleId = params.sampleId ?? "243";
  const document =
    sampleId === "long"
      ? longTextSchedule
      : sampleId === "missing"
        ? missingPortraitSchedule
        : createSampleSchedule(sampleId);

  return <EditorShell initialDocument={document} key={sampleId} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<EditorShell />} path="/" />
        <Route element={<SampleRoute />} path="/sample/:sampleId" />
      </Routes>
    </BrowserRouter>
  );
}
