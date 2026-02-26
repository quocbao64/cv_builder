import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/indexedDB';
import { useCVStore } from '../store/cvStore';
import { Button } from './ui/button';
import { ArrowLeft, Printer, Download, Save, Copy } from 'lucide-react';
import CVForm from './CVForm';
import CVPreview from './CVPreview';
import { useRef, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { CVFormValues } from '../schema/cvSchema';

export default function Builder() {
  const activeCVId = useCVStore((state) => state.activeCVId);
  const setActiveCVId = useCVStore((state) => state.setActiveCVId);
  const cv = useLiveQuery(() => db.cvs.get(activeCVId!), [activeCVId]);
  const [formData, setFormData] = useState<CVFormValues | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cv?.data && formData === undefined) {
      setFormData(cv.data);
    }
  }, [cv, formData]);

  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: cv?.title || 'CV',
  });

  const handleDataChange = async (newData: CVFormValues) => {
    setFormData(newData);
    setIsSaving(true);
    if (activeCVId) {
      await db.cvs.update(activeCVId, { data: newData, updatedAt: Date.now() });
    }
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleDuplicate = async () => {
    if (!formData || !cv) return;
    const newId = uuidv4();
    await db.cvs.add({
      id: newId,
      title: cv.title + ' (Bản sao)',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: JSON.parse(JSON.stringify(formData)),
    });
    setActiveCVId(newId);
    toast.success('Đã tạo phiên bản mới');
  };

  if (!cv || !formData) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="h-16 border-b bg-white dark:bg-neutral-900 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setActiveCVId(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold text-lg leading-tight">{cv.title}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {isSaving ? (
                <>
                  <Save className="h-3 w-3 animate-pulse" /> Đang lưu...
                </>
              ) : (
                <>Lưu thành công trên trình duyệt (IndexedDB)</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `${cv.title}.json`);
            dlAnchorElem.click();
          }}>
            <Download className="mr-2 h-4 w-4" /> Xuất JSON
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" /> Tạo bản sao
          </Button>
          <Button onClick={() => handlePrint()} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Printer className="mr-2 h-4 w-4" /> Xuất PDF
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Form Editor */}
        <aside className="w-1/2 overflow-y-auto border-r bg-white dark:bg-neutral-900 custom-scrollbar p-6">
          <div className="max-w-2xl mx-auto">
            <CVForm data={formData} onChange={handleDataChange} />
          </div>
        </aside>

        {/* Right Side: Live Preview */}
        <main className="w-1/2 bg-neutral-100 dark:bg-neutral-950 overflow-y-auto flex flex-col custom-scrollbar relative">
          <div className="flex justify-center py-10 w-full">
            <div
              className="bg-white shadow-2xl rounded-sm print:shadow-none print:m-0 print:transform-none w-[210mm] min-h-[297mm] overflow-hidden transition-all duration-300 transform scale-90 origin-top"
              ref={componentRef}
            >
              <CVPreview data={formData} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
