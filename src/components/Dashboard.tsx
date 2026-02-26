import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/indexedDB';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useCVStore } from '../store/cvStore';
import { defaultCVValues } from '../schema/cvSchema';
import { Plus, Trash2, Edit, Copy, Upload, LayoutGrid, CalendarDays, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function Dashboard() {
  const cvs = useLiveQuery(() => db.cvs.orderBy('updatedAt').reverse().toArray());
  const { setActiveCVId } = useCVStore();
  const [viewMode, setViewMode] = useState<'grid' | 'scheduler'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [renameDialog, setRenameDialog] = useState({ isOpen: false, id: '', title: '' });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: '' });
  
  const handleRename = async () => {
    if (!renameDialog.title.trim()) return;
    await db.cvs.update(renameDialog.id, { title: renameDialog.title.trim(), updatedAt: Date.now() });
    setRenameDialog({ isOpen: false, id: '', title: '' });
    toast.success('Đổi tên CV thành công!');
  };

  const handleCreate = async () => {
    const id = uuidv4();
    await db.cvs.add({
      id,
      title: 'Untitle CV - ' + new Date().toLocaleDateString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: defaultCVValues,
    });
    setActiveCVId(id);
    toast.success('Đã tạo CV mới');
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteDialog.id) {
      await db.cvs.delete(deleteDialog.id);
      toast.success('Đã xóa CV');
    }
    setDeleteDialog({ isOpen: false, id: '' });
  };

  const handleDuplicate = async (cv: any) => {
    const newId = uuidv4();
    await db.cvs.add({
      id: newId,
      title: cv.title + ' (Copy)',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: JSON.parse(JSON.stringify(cv.data)),
    });
    toast.success('Đã nhân bản CV');
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleUploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { parseCVFromPDF } = await import('../utils/pdfParser');
      const [parsedData, originalPdfBuffer] = await Promise.all([
        parseCVFromPDF(file),
        file.arrayBuffer(),
      ]);

      const id = uuidv4();
      await db.cvs.add({
        id,
        title: file.name.replace('.pdf', ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: parsedData || defaultCVValues,
        originalPdfBuffer,
      });

      setActiveCVId(id);
    } catch (err) {
      console.error('Upload PDF failed:', err);
    } finally {
      setIsUploading(false);
      // Reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-10">
        <div className="flex flex-col mb-4 md:mb-0">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent pb-1">Quản lý CV</h1>
          <p className="text-muted-foreground mt-1 text-md">Tạo, lưu trữ và nâng cấp các bản CV chuyên nghiệp của bạn</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-muted p-1 rounded-md">
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="px-3">
              <LayoutGrid size={16} className="mr-2" />
              Grid
            </Button>
            <Button variant={viewMode === 'scheduler' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('scheduler')} className="px-3">
              <CalendarDays size={16} className="mr-2" />
              Timeline
            </Button>
          </div>
          
          <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleUploadPDF} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center">
                <Upload size={16} className="mr-2" />
                Upload PDF
              </span>
            )}
          </Button>

          <Button onClick={handleCreate} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus size={16} />
            Tạo CV mới
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cvs?.map((cv) => (
          <Card key={cv.id} className="group flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-950">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-blue-400"></div>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <CardTitle className="truncate text-lg font-bold text-neutral-800 dark:text-neutral-100 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setActiveCVId(cv.id)} title={cv.title}>
                    {cv.title}
                  </CardTitle>
                  <CardDescription className="mt-1.5 flex items-center text-xs">
                    <CalendarDays size={12} className="mr-1 inline-block" />
                    {new Date(cv.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-indigo-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-neutral-50 hover:bg-indigo-50 dark:bg-neutral-900 dark:hover:bg-indigo-900/50" onClick={() => setRenameDialog({ isOpen: true, id: cv.id, title: cv.title })}>
                  <Edit2 size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800/80">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold shrink-0 shadow-sm border border-indigo-200 dark:border-indigo-800">
                  {cv.data.profile.fullName ? cv.data.profile.fullName.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate text-neutral-700 dark:text-neutral-200">
                    {cv.data.profile.fullName || 'Chưa cập nhật tên'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {cv.data.profile.position || 'Chưa có vị trí'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-4 pb-4 bg-neutral-50/40 dark:bg-neutral-900/30">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 shadow-sm" onClick={() => setActiveCVId(cv.id)}>
                <Edit size={14} className="mr-1.5" /> Chỉnh sửa
              </Button>
              <div className="flex gap-1.5">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full text-neutral-500 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50" onClick={() => handleDuplicate(cv)} title="Nhân bản">
                  <Copy size={13} />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full text-neutral-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/50" onClick={() => handleDelete(cv.id)} title="Xóa">
                  <Trash2 size={13} />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}

        {cvs?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/20 rounded-2xl text-muted-foreground w-full">
            <div className="w-20 h-20 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full">
                <LayoutGrid size={28} />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Bạn chưa có CV nào</h3>
            <p className="mb-6 text-sm">Bắt đầu tạo ấn tượng với nhà tuyển dụng ngay hôm nay.</p>
            <Button onClick={handleCreate} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full px-8 shadow-md hover:shadow-lg transition-all">
              <Plus size={18} className="mr-2" /> Tạo mới CV
            </Button>
          </div>
        )}
      </div>
      ) : (
        <div className="max-w-4xl mx-auto py-8">
          <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900/50 ml-6 md:ml-0 md:pl-0 space-y-10 select-none">
            {cvs?.map((cv) => (
              <div key={cv.id} className="relative pl-10 md:pl-0 group">
                <div className="md:hidden absolute w-5 h-5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full left-[-11px] top-6 ring-4 ring-white dark:ring-neutral-950 shadow-sm" />
                <div className="md:grid md:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] items-center gap-8">
                  <div className="hidden md:flex flex-col items-end text-sm mt-1 relative pr-6">
                    <div className="absolute w-5 h-5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full right-[-11px] top-1/2 -translate-y-1/2 ring-4 ring-white dark:ring-neutral-950 shadow-sm transition-transform group-hover:scale-125 duration-300" />
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 text-base">{new Date(cv.updatedAt).toLocaleDateString()}</span>
                    <span className="text-muted-foreground bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full text-xs mt-1 font-medium">{new Date(cv.updatedAt).toLocaleTimeString()}</span>
                  </div>
                  <Card className="hover:shadow-xl transition-all duration-300 relative z-0 border-neutral-200 dark:border-neutral-800 group-hover:-translate-y-0.5 overflow-hidden bg-white dark:bg-neutral-950">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="py-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="truncate text-lg font-bold text-neutral-800 dark:text-neutral-100" title={cv.title}>{cv.title}</CardTitle>
                          <CardDescription className="md:hidden mt-1.5 flex items-center">
                            <CalendarDays size={12} className="mr-1" />
                            {new Date(cv.updatedAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1 text-muted-foreground hover:text-indigo-600 rounded-full bg-neutral-50 hover:bg-indigo-50 dark:bg-neutral-900 dark:hover:bg-indigo-900/50 transition-colors" onClick={() => setRenameDialog({ isOpen: true, id: cv.id, title: cv.title })}>
                          <Edit2 size={14} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800/80">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-200">{cv.data.profile.fullName || 'Chưa cập nhật tên'}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-xs border border-indigo-200 dark:border-indigo-800/50 shadow-sm">{cv.data.profile.position || 'Chưa có vị trí'}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="py-3.5 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40">
                       <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm" onClick={() => setActiveCVId(cv.id)}>
                        <Edit size={14} className="mr-1.5" /> Mở CV
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-md border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={() => handleDuplicate(cv)}>
                        <Copy size={13} className="mr-1.5" /> Nhân bản
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 rounded-md transition-colors" onClick={() => handleDelete(cv.id)}>
                        <Trash2 size={15} />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            ))}
            
            {cvs?.length === 0 && (
              <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl mx-10">
                <p>Không có dữ liệu lịch sử</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Rename Dialog */}
      <Dialog open={renameDialog.isOpen} onOpenChange={(open) => !open && setRenameDialog({ ...renameDialog, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi tên CV</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cv-title">Tên mới</Label>
            <Input 
              id="cv-title"
              value={renameDialog.title} 
              onChange={(e) => setRenameDialog({ ...renameDialog, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ ...renameDialog, isOpen: false })}>Hủy</Button>
            <Button onClick={handleRename}>Lưu tên</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, id: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa CV</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
              Bạn có chắc chắn muốn xóa CV này không? Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ isOpen: false, id: '' })}>Hủy</Button>
            <Button variant="destructive" onClick={confirmDelete}>Xóa CV</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
