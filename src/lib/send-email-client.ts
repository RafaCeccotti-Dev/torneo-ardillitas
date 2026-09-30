export const COORDINATOR_EMAIL = "torneoardillitas@gmail.com";

function pdfFileFromBase64(pdfBase64: string, filename: string) {
  const binary = atob(pdfBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: "application/pdf" });
}

export function downloadPdfBase64(pdfBase64: string, filename: string) {
  const file = pdfFileFromBase64(pdfBase64, filename);
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * FormSubmit AJAX no adjunta archivos. Usamos POST multipart clásico
 * (como un form HTML) para que el PDF viaje como attachment.
 */
export async function sendPdfViaFormSubmitFromBrowser(input: {
  to: string;
  subject: string;
  text: string;
  pdfBase64: string;
  filename: string;
}) {
  const file = pdfFileFromBase64(input.pdfBase64, input.filename);

  await new Promise<void>((resolve, reject) => {
    const iframeName = `fs_${Date.now()}`;
    const iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `https://formsubmit.co/${encodeURIComponent(input.to)}`;
    form.enctype = "multipart/form-data";
    form.target = iframeName;
    form.style.display = "none";

    const fields: Record<string, string> = {
      _subject: input.subject,
      _template: "box",
      _captcha: "false",
      _blacklist: "spammy",
      plantel: input.text,
    };

    for (const [name, value] of Object.entries(fields)) {
      const el = document.createElement("input");
      el.type = "hidden";
      el.name = name;
      el.value = value;
      form.appendChild(el);
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.name = "attachment";
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    form.appendChild(fileInput);

    const cleanup = () => {
      form.remove();
      iframe.remove();
    };

    iframe.addEventListener("load", () => {
      cleanup();
      resolve();
    });

    document.body.appendChild(form);
    try {
      form.submit();
    } catch (err) {
      cleanup();
      reject(err);
      return;
    }

    // Si el iframe no dispara load (algunos browsers), resolvemos igual
    window.setTimeout(() => {
      cleanup();
      resolve();
    }, 4000);
  });
}
