import { HTTPError } from "ky";
import { api } from "@/lib/api-client.ts";
import type { User } from "@/types/user.ts";

export async function getUsers(): Promise<User[]> {
  try {
    return await api.get("users").json<User[]>();
  } catch (err) {
    if (err instanceof HTTPError) {
      throw new Error(`Gagal memuat pengguna (${err.response.status})`);
    }
    throw new Error("Kesalahan jaringan. Periksa koneksi Anda.");
  }
}
