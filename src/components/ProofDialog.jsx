import { useEffect, useRef, useState } from 'react';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error(`${file.name} is not a readable image.`));
      image.onload = () => resolve({ name: file.name, url: reader.result });
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
export default function ProofDialog({ task, onClose, onSubmit }) {
  const ref = useRef(null), mounted = useRef(false);
  const [text, setText] = useState(''), [images, setImages] = useState([]), [error, setError] = useState(''), [reading, setReading] = useState(false);
  useEffect(() => {
    mounted.current = true;
    const dialog = ref.current;
    dialog.showModal();
    return () => { mounted.current = false; if (dialog.open) dialog.close(); };
  }, []);
  async function addFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setError('');
    if (images.length + files.length > 5) { setError('You can add up to 5 images.'); return; }
    if (files.some(file => !allowedTypes.includes(file.type))) { setError('Please choose JPG, PNG, WebP or GIF images.'); return; }
    if (files.some(file => file.size > 5 * 1024 * 1024)) { setError('Each image must be 5 MB or smaller.'); return; }
    setReading(true);
    try {
      const added = await Promise.all(files.map(readImage));
      if (mounted.current) setImages(previous => [...previous, ...added]);
    } catch (failure) { if (mounted.current) setError(failure.message); }
    finally { if (mounted.current) setReading(false); }
  }
  function submit(event) {
    event.preventDefault();
    if (reading) return;
    if (!text.trim() && !images.length) { setError('Add an image or describe your completed work.'); return; }
    onSubmit({ text: text.trim(), images });
  }
  return <dialog ref={ref} id="proof-dialog" className="proof-dialog" aria-labelledby="proof-title" onCancel={onClose}>
    <button type="button" className="dialog-close" aria-label="Close proof form" onClick={onClose}>×</button>
    <h2 id="proof-title">Submit proof · Task {task.id}</h2>
    <p className="proof-task-summary">{task.description}</p>
    <form onSubmit={submit}>
      <label className="proof-label" htmlFor="proof-description">Describe your completed work</label>
      <textarea id="proof-description" rows={4} maxLength={2000} placeholder="Add details or a link to your completed work…" value={text} onChange={event => setText(event.target.value)}/>
      <span className="proof-count">{text.length}/2000</span>
      <label className="proof-label" htmlFor="proof-files">Images</label>
      <input id="proof-files" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={reading || images.length >= 5} onChange={addFiles}/>
      <p className="proof-hint">Up to 5 images · JPG, PNG, WebP or GIF · 5 MB each</p>
      <div className="proof-previews">{images.map((image, index) => <figure key={`${image.name}-${index}`}><img src={image.url} alt={image.name}/><button type="button" aria-label={`Remove image ${index + 1}`} disabled={reading} onClick={() => setImages(previous => previous.filter((_, position) => position !== index))}>×</button><figcaption>{image.name}</figcaption></figure>)}</div>
      {error && <p className="proof-error" role="alert">{error}</p>}
      <p className="proof-hint">Add images, text, or both. This demo keeps your submission in this page only; refreshing clears it.</p>
      <button type="submit" className="primary wide" disabled={reading}>{reading ? 'Reading images…' : 'Submit proof'}</button>
    </form>
  </dialog>;
}
