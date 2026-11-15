export function showError(error: unknown): void {
  console.error(error);
  const message = document.createElement('pre');
  message.className = 'dc-error';
  message.setAttribute('role', 'alert');
  message.textContent = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  document.body.append(message);
}
