import axios from "axios";

import { apiClient } from "./client";
import type {
  AdminCourseModule,
  CourseSettings,
  PublicPricing,
  Shop,
  StudentDetail,
  StudentRow,
  CourseModule,
  Lesson,
  LessonMaterial,
  LessonView,
  MaterialKind,
  ProgramModule,
  StorageStatus,
} from "@/types";

export const courseApi = {
  /** Программа курса для лендинга (без входа). */
  async program(): Promise<ProgramModule[]> {
    const r = await apiClient.get("/api/v1/course/program");
    return r.data;
  },

  async modules(): Promise<CourseModule[]> {
    const r = await apiClient.get("/api/v1/course/modules");
    return r.data;
  },

  async lesson(id: string): Promise<LessonView> {
    const r = await apiClient.get(`/api/v1/course/lessons/${id}`);
    return r.data;
  },

  /** Кнопка «Урок пройден». */
  async complete(
    id: string,
  ): Promise<{ completed_at: string; next_lesson_id: string | null; next_lesson_status: string | null }> {
    const r = await apiClient.post(`/api/v1/course/lessons/${id}/complete`);
    return r.data;
  },

  /** Цены без входа (оферта). */
  async pricing(): Promise<PublicPricing> {
    const r = await apiClient.get("/api/v1/course/pricing");
    return r.data;
  },

  async shop(): Promise<Shop> {
    const r = await apiClient.get("/api/v1/course/shop");
    return r.data;
  },

  async checkout(product: "course" | "module", moduleId?: string): Promise<{ payment_url: string }> {
    const r = await apiClient.post("/api/v1/course/checkout", {
      product,
      module_id: moduleId ?? null,
    });
    return r.data;
  },
};

export interface LessonInput {
  module_id: string;
  title: string;
  description: string;
  is_published: boolean;
}

interface UploadTicket {
  material: LessonMaterial;
  part_size: number;
  part_urls: string[];
}

export const adminCourseApi = {
  async storage(): Promise<StorageStatus> {
    const r = await apiClient.get("/api/v1/admin/course/storage");
    return r.data;
  },

  async modules(): Promise<AdminCourseModule[]> {
    const r = await apiClient.get("/api/v1/admin/course/modules");
    return r.data;
  },

  async settings(): Promise<CourseSettings> {
    const r = await apiClient.get("/api/v1/admin/course/settings");
    return r.data;
  },

  async updateSettings(data: { full_price?: number; access_days?: number }): Promise<CourseSettings> {
    const r = await apiClient.patch("/api/v1/admin/course/settings", data);
    return r.data;
  },

  async students(params: { search?: string; page?: number } = {}): Promise<StudentRow[]> {
    const r = await apiClient.get("/api/v1/admin/course/students", { params });
    return r.data;
  },

  async student(userId: string): Promise<StudentDetail> {
    const r = await apiClient.get(`/api/v1/admin/course/students/${userId}`);
    return r.data;
  },

  /** Выдать доступ вручную: moduleId = null — весь курс. */
  async grant(userId: string, moduleId: string | null, days?: number): Promise<void> {
    await apiClient.post("/api/v1/admin/course/access", {
      user_id: userId,
      module_id: moduleId,
      days: days ?? null,
    });
  },

  async revoke(accessId: string): Promise<void> {
    await apiClient.delete(`/api/v1/admin/course/access/${accessId}`);
  },

  async updateModule(
    id: string,
    data: { title?: string; description?: string; price?: number },
  ): Promise<void> {
    await apiClient.patch(`/api/v1/admin/course/modules/${id}`, data);
  },

  async lesson(id: string): Promise<Lesson> {
    const r = await apiClient.get(`/api/v1/admin/course/lessons/${id}`);
    return r.data;
  },

  async createLesson(data: LessonInput): Promise<Lesson> {
    const r = await apiClient.post("/api/v1/admin/course/lessons", data);
    return r.data;
  },

  async updateLesson(id: string, data: Partial<LessonInput>): Promise<Lesson> {
    const r = await apiClient.patch(`/api/v1/admin/course/lessons/${id}`, data);
    return r.data;
  },

  async deleteLesson(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/admin/course/lessons/${id}`);
  },

  async reorderLessons(lessonIds: string[]): Promise<void> {
    await apiClient.put("/api/v1/admin/course/lessons/order", { lesson_ids: lessonIds });
  },

  async renameMaterial(id: string, title: string): Promise<LessonMaterial> {
    const r = await apiClient.patch(`/api/v1/admin/course/materials/${id}`, { title });
    return r.data;
  },

  async deleteMaterial(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/admin/course/materials/${id}`);
  },

  /**
   * Загрузить файл урока прямо в S3: сервер выдаёт подписанные ссылки,
   * браузер отправляет файл частями (каждую часть повторяет до 3 раз),
   * затем сервер собирает части в один файл.
   */
  async upload(
    lessonId: string,
    file: File,
    kind: MaterialKind,
    onProgress: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<LessonMaterial> {
    const { data: ticket } = await apiClient.post<UploadTicket>(
      `/api/v1/admin/course/lessons/${lessonId}/uploads`,
      {
        kind,
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      },
    );

    const loaded = new Array<number>(ticket.part_urls.length).fill(0);
    const report = () =>
      onProgress(Math.min(99, Math.round((loaded.reduce((a, b) => a + b, 0) / file.size) * 100)));

    const parts: { part_number: number; etag: string }[] = [];
    try {
      for (let i = 0; i < ticket.part_urls.length; i++) {
        const chunk = file.slice(i * ticket.part_size, (i + 1) * ticket.part_size);
        let etag = "";
        for (let attempt = 1; ; attempt++) {
          try {
            // Обычный axios, не apiClient: в S3 не нужен наш токен и baseURL.
            const r = await axios.put(ticket.part_urls[i], chunk, {
              signal,
              // Без явного типа axios пометит кусок файла как форму
              // (x-www-form-urlencoded), а это не форма.
              headers: { "Content-Type": "application/octet-stream" },
              onUploadProgress: (e) => {
                loaded[i] = e.loaded;
                report();
              },
            });
            etag = r.headers["etag"] ?? "";
            break;
          } catch (err) {
            if (signal?.aborted || attempt >= 3) throw err;
            loaded[i] = 0;
            await new Promise((res) => setTimeout(res, 1500 * attempt));
          }
        }
        if (!etag) {
          throw new Error("Хранилище не вернуло ETag: проверьте настройки CORS бакета");
        }
        parts.push({ part_number: i + 1, etag });
      }
    } catch (err) {
      // Незавершённую загрузку удаляем, чтобы она не висела в списке.
      await adminCourseApi.deleteMaterial(ticket.material.id).catch(() => undefined);
      throw err;
    }

    const r = await apiClient.post<LessonMaterial>(
      `/api/v1/admin/course/materials/${ticket.material.id}/complete`,
      { parts },
    );
    onProgress(100);
    return r.data;
  },
};
