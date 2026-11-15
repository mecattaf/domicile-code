export interface FloatingSidebarOptions {
  onFocus?: () => void;
  onChange: (floating: boolean) => void;
}

export interface FloatingSidebar {
  setFloating(value: boolean): void;
  setVisible(value: boolean): void;
  isFloating(): boolean;
  rect(): DOMRect | null;
}

export function createFloatingSidebar(
  sidebar: HTMLElement,
  grid: HTMLElement,
  options: FloatingSidebarOptions
): FloatingSidebar {
  let floating = false;
  let visible = true;
  let wrapper: HTMLElement | null = null;
  let header: HTMLElement | null = null;
  let body: HTMLElement | null = null;
  let dockBtn: HTMLButtonElement | null = null;

  function ensureWrapper(): void {
    if (wrapper) return;
    wrapper = document.createElement('section');
    wrapper.className = 'dc-float';
    wrapper.style.left = '80px';
    wrapper.style.top = '100px';
    wrapper.hidden = !visible;

    header = document.createElement('header');
    header.className = 'dc-float-header';
    const label = document.createElement('span');
    label.textContent = 'Explorer';
    dockBtn = document.createElement('button');
    dockBtn.type = 'button';
    dockBtn.textContent = 'Dock';
    dockBtn.className = 'dc-float-dock';
    dockBtn.setAttribute('aria-label', 'Dock Explorer');
    header.appendChild(label);
    header.appendChild(dockBtn);

    body = document.createElement('div');
    body.className = 'dc-float-body';
    body.appendChild(sidebar);

    wrapper.appendChild(header);
    wrapper.appendChild(body);
    document.body.appendChild(wrapper);

    wrapper.addEventListener('pointerdown', onFocusDown, { capture: true });
    header.addEventListener('pointerdown', onDragStart);
    header.addEventListener('pointermove', onDragMove);
    header.addEventListener('pointerup', onDragEnd);
    header.addEventListener('pointercancel', onDragEnd);
    dockBtn.addEventListener('click', onDockClick);
  }

  function destroyWrapper(): void {
    if (!wrapper) return;
    wrapper.remove();
    wrapper = null;
    header = null;
    body = null;
    dockBtn = null;
  }

  function onFocusDown(): void {
    if (options.onFocus) options.onFocus();
  }

  function onDockClick(e: Event): void {
    e.stopPropagation();
    setFloating(false);
  }

  let dragging = false;
  let dragPointer: number | undefined;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  function onDragStart(e: PointerEvent): void {
    if (e.button !== 0) return;
    if (e.target instanceof Element && e.target.closest('button')) return;
    e.preventDefault();
    if (!header) return;
    header.setPointerCapture(e.pointerId);
    dragging = true;
    dragPointer = e.pointerId;
    const r = wrapper ? wrapper.getBoundingClientRect() : null;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = r ? r.left : 0;
    startTop = r ? r.top : 0;
  }

  function onDragMove(e: PointerEvent): void {
    if (!dragging || !wrapper || e.pointerId !== dragPointer) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const r = wrapper.getBoundingClientRect();
    const maxX = Math.max(0, window.innerWidth - r.width);
    const maxY = Math.max(0, window.innerHeight - r.height);
    const x = Math.min(maxX, Math.max(0, startLeft + dx));
    const y = Math.min(maxY, Math.max(0, startTop + dy));
    wrapper.style.left = x + 'px';
    wrapper.style.top = y + 'px';
  }

  function onDragEnd(e: PointerEvent): void {
    if (e.pointerId !== dragPointer) return;
    endDrag();
  }

  function endDrag(): void {
    if (header && dragPointer !== undefined && header.hasPointerCapture(dragPointer)) header.releasePointerCapture(dragPointer);
    dragPointer = undefined;
    dragging = false;
  }

  function setFloating(value: boolean): void {
    if (floating === value) return;
    floating = value;
    if (value) {
      ensureWrapper();
      if (wrapper) wrapper.hidden = !visible;
      sidebar.classList.add('dc-sidebar-floating');
      options.onChange(true);
    } else {
      endDrag();
      const center = grid.querySelector('.dc-center') as HTMLElement | null;
      if (center) {
        grid.insertBefore(sidebar, center);
      } else {
        grid.appendChild(sidebar);
      }
      sidebar.classList.remove('dc-sidebar-floating');
      destroyWrapper();
      options.onChange(false);
    }
  }

  function setVisible(value: boolean): void {
    visible = value;
    if (floating && wrapper) {
      wrapper.hidden = !value;
    }
  }

  function isFloating(): boolean {
    return floating;
  }

  function rect(): DOMRect | null {
    if (!floating || !wrapper) return null;
    return wrapper.getBoundingClientRect();
  }

  return { setFloating, setVisible, isFloating, rect };
}
