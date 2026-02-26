import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cvSchema, CVFormValues } from '../schema/cvSchema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import RichTextEditor from './RichTextEditor';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Plus, Trash2, Settings2, Palette, Type, LayoutTemplate } from 'lucide-react';
import { useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

interface CVFormProps {
  data: CVFormValues;
  onChange: (data: CVFormValues) => void;
}

export default function CVForm({ data, onChange }: CVFormProps) {
  const form = useForm<CVFormValues>({
    resolver: zodResolver(cvSchema) as any,
    defaultValues: data,
  });

  // Watch for changes and inform parent
  useEffect(() => {
    const subscription = form.watch((value) => {
      // @ts-ignore
      onChange(value as CVFormValues);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onChange]);

  const { fields: expFields, append: appendExp, remove: removeExp, move: moveExp } = useFieldArray({
    name: 'experience',
    control: form.control,
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    name: 'education',
    control: form.control,
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    name: 'skills',
    control: form.control,
  });

  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({
    name: 'projects',
    control: form.control,
  });

  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({
    name: 'certifications',
    control: form.control,
  });

  const moduleNames: Record<string, string> = {
    summary: 'Mục tiêu & Giới thiệu',
    experience: 'Kinh nghiệm làm việc',
    education: 'Học vấn',
    skills: 'Kỹ năng',
    projects: 'Dự án',
    certifications: 'Chứng chỉ & Giải thưởng',
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndExperience = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = expFields.findIndex((item) => item.id === active.id);
      const newIndex = expFields.findIndex((item) => item.id === over.id);
      moveExp(oldIndex, newIndex);
    }
  };

  const handleDragEndModules = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const currentOrder = form.getValues('settings.moduleOrder') || [];
      const oldIndex = currentOrder.indexOf(active.id as string);
      const newIndex = currentOrder.indexOf(over.id as string);
      
      const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
      form.setValue('settings.moduleOrder', newOrder, { shouldDirty: true, shouldTouch: true });
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6 pb-20">
        <Accordion type="multiple" defaultValue={['profile']} className="w-full space-y-4">
          
          {/* SETTINGS SECTION */}
          <AccordionItem value="settings" className="border rounded-lg bg-indigo-50/50 p-2 dark:bg-indigo-950/20">
            <AccordionTrigger className="px-4 hover:no-underline font-bold text-indigo-700 dark:text-indigo-400">
              <div className="flex items-center gap-2"><Settings2 size={18}/> Cài đặt hiển thị (Màu sắc, Font, Bố cục)</div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-4 pb-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField control={form.control} name="settings.primaryColor" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Palette size={16}/> Màu chủ đạo (Mã Hex)</FormLabel>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={field.value || '#2563eb'}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="shrink-0 w-10 h-10 rounded-md border cursor-pointer p-0.5"
                      />
                      <FormControl><Input placeholder="#2563eb" {...field} /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="settings.fontFamily" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Type size={16}/> Phông chữ (Tailwind)</FormLabel>
                    <FormControl>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field}>
                        <option value="font-sans">Sans Serif (Mặc định)</option>
                        <option value="font-serif">Serif (Cổ điển)</option>
                        <option value="font-mono">Monospace (Lập trình)</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="settings.margin" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><LayoutTemplate size={16}/> Lề (Padding)</FormLabel>
                    <FormControl>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field}>
                        <option value="p-6">Hẹp (p-6)</option>
                        <option value="p-10">Vừa (p-10)</option>
                        <option value="p-14">Rộng (p-14)</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="settings.language" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Type size={16}/> Ngôn ngữ (CV)</FormLabel>
                    <FormControl>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field}>
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="mt-6 border-t pt-4">
                <label className="mb-4 block text-base font-semibold">Thứ tự hiển thị các phần (Kéo thả để sắp xếp)</label>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndModules}>
                  <SortableContext items={form.watch('settings.moduleOrder') || []} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 max-w-sm">
                      {(form.watch('settings.moduleOrder') || []).map((modId) => (
                        <SortableItem key={modId} id={modId}>
                          <div className="p-3 bg-white border rounded-md shadow-sm font-medium flex items-center justify-between">
                            <span>{moduleNames[modId] || modId}</span>
                            <span className="text-xs text-muted-foreground uppercase bg-neutral-100 px-2 py-0.5 rounded">{modId}</span>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* PROFILE SECTION */}
          <AccordionItem value="profile" className="border rounded-lg bg-white p-2">
            <AccordionTrigger className="px-4 hover:no-underline font-semibold text-primary">Thông tin cá nhân</AccordionTrigger>
            <AccordionContent className="px-4 pt-4 pb-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="profile.fullName" render={({ field }) => (
                  <FormItem><FormLabel>Họ và tên</FormLabel><FormControl><Input placeholder="Nguyễn Văn A" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="profile.position" render={({ field }) => (
                  <FormItem><FormLabel>Vị trí</FormLabel><FormControl><Input placeholder="Frontend Developer" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="profile.email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="example@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="profile.phone" render={({ field }) => (
                  <FormItem><FormLabel>Số điện thoại</FormLabel><FormControl><Input placeholder="0909..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="profile.location" render={({ field }) => (
                  <FormItem><FormLabel>Khu vực</FormLabel><FormControl><Input placeholder="TP.HCM, Việt Nam" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="profile.linkedin" render={({ field }) => (
                  <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="profile.github" render={({ field }) => (
                  <FormItem><FormLabel>GitHub URL</FormLabel><FormControl><Input placeholder="https://github.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="profile.website" render={({ field }) => (
                  <FormItem><FormLabel>Website cá nhân</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="profile.summary" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả bản thân</FormLabel>
                  <FormControl>
                    <div className="bg-white">
                      <RichTextEditor value={field.value || ''} onChange={field.onChange} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </AccordionContent>
          </AccordionItem>

          {/* EXPERIENCE SECTION */}
          <AccordionItem value="experience" className="border rounded-lg bg-white p-2">
            <AccordionTrigger className="px-4 hover:no-underline font-semibold text-primary">Kinh nghiệm làm việc</AccordionTrigger>
            <AccordionContent className="px-4 pt-4 pb-2 space-y-6">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndExperience}>
                <SortableContext items={expFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  {expFields.map((field, index) => (
                    <SortableItem key={field.id} id={field.id}>
                      <div className="p-4 border border-dashed rounded-md relative group bg-neutral-50/50 w-full">
                        <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                          <Button type="button" variant="destructive" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeExp(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name={`experience.${index}.company`} render={({ field }) => (
                            <FormItem><FormLabel>Công ty</FormLabel><FormControl><Input placeholder="Tên công ty" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`experience.${index}.role`} render={({ field }) => (
                            <FormItem><FormLabel>Chức danh</FormLabel><FormControl><Input placeholder=" VD: Nhóm trưởng" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`experience.${index}.startDate`} render={({ field }) => (
                            <FormItem><FormLabel>Từ tháng/năm</FormLabel><FormControl><Input placeholder="08/2021" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`experience.${index}.endDate`} render={({ field }) => (
                            <FormItem><FormLabel>Đến tháng/năm</FormLabel><FormControl><Input placeholder="Present" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name={`experience.${index}.description`} render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Mô tả chi tiết</FormLabel>
                            <FormControl>
                              <div className="bg-white">
                                <RichTextEditor value={field.value || ''} onChange={field.onChange} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => appendExp({ id: crypto.randomUUID(), company: '', role: '', startDate: '', endDate: '', description: '', isCurrent: false })}>
                <Plus className="mr-2 h-4 w-4" /> Thêm kinh nghiệm
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* EDUCATION SECTION */}
          <AccordionItem value="education" className="border rounded-lg bg-white p-2">
            <AccordionTrigger className="px-4 hover:no-underline font-semibold text-primary">Quá trình học tập</AccordionTrigger>
            <AccordionContent className="px-4 pt-4 pb-2 space-y-6">
              {eduFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-dashed rounded-md relative group bg-neutral-50/50">
                  <div className="absolute top-2 right-2">
                    <Button type="button" variant="destructive" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeEdu(index)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name={`education.${index}.institution`} render={({ field }) => (
                      <FormItem><FormLabel>Trường/Tổ chức</FormLabel><FormControl><Input placeholder="Đại học..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`education.${index}.degree`} render={({ field }) => (
                      <FormItem><FormLabel>Bằng cấp</FormLabel><FormControl><Input placeholder="Cử nhân..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`education.${index}.startDate`} render={({ field }) => (
                      <FormItem><FormLabel>Từ năm</FormLabel><FormControl><Input placeholder="2018" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`education.${index}.endDate`} render={({ field }) => (
                      <FormItem><FormLabel>Đến năm</FormLabel><FormControl><Input placeholder="2022" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name={`education.${index}.description`} render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Mô tả thêm (Tùy chọn)</FormLabel>
                      <FormControl>
                        <div className="bg-white">
                          <RichTextEditor value={field.value || ''} onChange={field.onChange} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => appendEdu({ id: crypto.randomUUID(), institution: '', degree: '', startDate: '', endDate: '', description: '' })}>
                <Plus className="mr-2 h-4 w-4" /> Thêm học vấn
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* SKILLS SECTION */}
          <AccordionItem value="skills" className="border rounded-lg bg-white p-2">
            <AccordionTrigger className="px-4 hover:no-underline font-semibold text-primary">Kỹ năng chuyên môn</AccordionTrigger>
            <AccordionContent className="px-4 pt-4 pb-2 space-y-6">
              {skillFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-dashed rounded-md relative group bg-neutral-50/50">
                  <div className="absolute top-2 right-2">
                    <Button type="button" variant="destructive" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeSkill(index)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <FormField control={form.control} name={`skills.${index}.category`} render={({ field }) => (
                    <FormItem><FormLabel>Nhóm kỹ năng</FormLabel><FormControl><Input placeholder="Frontend, Backend, Công cụ..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name={`skills.${index}.description`} render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Các kỹ năng</FormLabel>
                      <FormControl>
                         <div className="bg-white">
                           <RichTextEditor value={field.value || ''} onChange={field.onChange} />
                         </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => appendSkill({ id: crypto.randomUUID(), category: '', description: '' })}>
                <Plus className="mr-2 h-4 w-4" /> Thêm nhóm kỹ năng
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* PROJECTS SECTION */}
          <AccordionItem value="projects" className="border rounded-lg bg-white p-2">
            <AccordionTrigger className="px-4 hover:no-underline font-semibold text-primary">Dự án tham gia</AccordionTrigger>
            <AccordionContent className="px-4 pt-4 pb-2 space-y-6">
              {projectFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-dashed rounded-md relative group bg-neutral-50/50">
                   <div className="absolute top-2 right-2">
                    <Button type="button" variant="destructive" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeProject(index)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <FormField control={form.control} name={`projects.${index}.name`} render={({ field }) => (
                      <FormItem className="col-span-2"><FormLabel>Tên dự án</FormLabel><FormControl><Input placeholder="E-commerce Platform..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`projects.${index}.role`} render={({ field }) => (
                      <FormItem><FormLabel>Vai trò</FormLabel><FormControl><Input placeholder="Fullstack Developer..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name={`projects.${index}.link`} render={({ field }) => (
                      <FormItem><FormLabel>Link dự án</FormLabel><FormControl><Input placeholder="https://github.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name={`projects.${index}.description`} render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Mô tả chi tiết</FormLabel>
                      <FormControl>
                        <div className="bg-white">
                          <RichTextEditor value={field.value || ''} onChange={field.onChange} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => appendProject({ id: crypto.randomUUID(), name: '', role: '', description: '', technologies: [], link: '' })}>
                <Plus className="mr-2 h-4 w-4" /> Thêm dự án
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* CERTIFICATIONS SECTION */}
          <AccordionItem value="certifications" className="border rounded-lg bg-white p-2">
            <AccordionTrigger className="px-4 hover:no-underline font-semibold text-primary">Chứng chỉ & Giải thưởng ({certFields.length})</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {certFields.map((field, index) => (
                <div key={field.id} className="relative border rounded-lg p-4 bg-neutral-50">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-destructive" onClick={() => removeCert(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <FormField control={form.control} name={`certifications.${index}.name`} render={({ field }) => (
                        <FormItem><FormLabel>Tên chứng chỉ / giải thưởng</FormLabel><FormControl><Input placeholder="AWS Cloud Technical Essentials..." {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name={`certifications.${index}.year`} render={({ field }) => (
                      <FormItem><FormLabel>Năm</FormLabel><FormControl><Input placeholder="2023" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => appendCert({ id: crypto.randomUUID(), name: '', year: '' })}>
                <Plus className="mr-2 h-4 w-4" /> Thêm chứng chỉ
              </Button>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </form>
    </Form>
  );
}
