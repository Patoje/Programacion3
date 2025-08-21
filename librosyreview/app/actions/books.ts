'use server'

export interface SimpleBook {
  id: string;
  title: string;
  authors: string[];
  thumbnail?: string;
}

export interface DetailedBook extends SimpleBook {
  description?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  publisher?: string;
  language?: string;
}

// Exportar estas funciones para testing
export function mapVolumeToSimple(volume: any): SimpleBook {
  const info = volume.volumeInfo || {};
  const imageLinks = info.imageLinks || {};
  return {
    id: volume.id,
    title: info.title || 'Título desconocido',
    authors: info.authors || [],
    thumbnail: imageLinks.thumbnail || imageLinks.smallThumbnail || undefined,
  };
}

export function mapVolumeToDetailed(volume: any): DetailedBook {
  const simple = mapVolumeToSimple(volume);
  const info = volume.volumeInfo || {};
  return {
    ...simple,
    description: info.description,
    publishedDate: info.publishedDate,
    pageCount: info.pageCount,
    categories: info.categories || [],
    publisher: info.publisher,
    language: info.language,
  };
}

export async function searchBooks(query: string): Promise<SimpleBook[]> {
  if (!query || query.trim().length === 0) return [];
  
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map(mapVolumeToSimple);
  } catch (error) {
    // Manejar errores de red u otros errores
    console.error('Error fetching books:', error);
    return [];
  }
}

export async function getBookById(id: string): Promise<DetailedBook | null> {
  if (!id) return null;
  const url = `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return mapVolumeToDetailed(data);
}