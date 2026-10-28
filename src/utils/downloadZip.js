import JSZip from 'jszip';
import { ref, getBlob } from 'firebase/storage';
import { storage } from '../services/firebase';

const sanitize = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 80) || 'sem_nome';

/**
 * Baixa todos os anexos dos registros em um único .zip (uma pasta por registro).
 * groups: [{ folder: 'nome da pasta', basePath: 'caminho/no/storage', files: [{ name, url }] }]
 * Retorna { total, falhas }.
 */
export async function downloadAttachmentsZip(groups, zipName) {
  const zip = new JSZip();
  let total = 0;
  let falhas = 0;
  const usedFolders = new Set();

  for (const group of groups) {
    if (!group.files || group.files.length === 0) continue;
    let folderName = sanitize(group.folder);
    let n = 2;
    while (usedFolders.has(folderName)) folderName = `${sanitize(group.folder)} (${n++})`;
    usedFolders.add(folderName);
    const folder = zip.folder(folderName);

    await Promise.all(group.files.map(async (file) => {
      try {
        let blob;
        try {
          // 1º: via proxy do próprio site (não depende de CORS no bucket)
          const res = await fetch(`/api/anexo?url=${encodeURIComponent(file.url)}`);
          if (!res.ok) throw new Error(res.statusText);
          blob = await res.blob();
        } catch {
          // 2º: direto do Storage (funciona se o CORS do bucket estiver configurado)
          blob = await getBlob(ref(storage, `${group.basePath}/${file.name}`));
        }
        folder.file(sanitize(file.name), blob);
        total++;
      } catch (e) {
        console.warn('Falha ao baixar anexo:', file.name, e);
        falhas++;
      }
    }));
  }

  if (total > 0) {
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  return { total, falhas };
}
