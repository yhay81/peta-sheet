(() => {
  "use strict";

  const presets = {
    address12: {
      columns: 2,
      gapX: 5.2,
      gapY: 0,
      height: 42.3,
      label: "12面・2列 × 6行",
      left: 18.6,
      rows: 6,
      top: 21.2,
      width: 83.8,
    },
    display24: {
      columns: 3,
      gapX: 0,
      gapY: 0,
      height: 33.9,
      label: "24面・3列 × 8行",
      left: 6,
      rows: 8,
      top: 12.9,
      width: 66,
    },
    small65: {
      columns: 5,
      gapX: 0,
      gapY: 0,
      height: 21.2,
      label: "65面・5列 × 13行",
      left: 9.75,
      rows: 13,
      top: 10.7,
      width: 38.1,
    },
  };

  const printSheets = document.querySelector("#print-sheets");
  const sheetStage = document.querySelector("#sheet-stage");
  const labelData = document.querySelector("#label-data");
  const dataCount = document.querySelector("#data-count");
  const repeatFirst = document.querySelector("#repeat-first");
  const fontFamily = document.querySelector("#font-family");
  const fontSize = document.querySelector("#font-size");
  const fontSizeValue = document.querySelector("#font-size-value");
  const printBorder = document.querySelector("#print-border");
  const offsetX = document.querySelector("#offset-x");
  const offsetY = document.querySelector("#offset-y");
  const printButton = document.querySelector("#print-labels");
  const resetButton = document.querySelector("#reset-all");
  const sheetDescription = document.querySelector("#sheet-description");
  const pageControl = document.querySelector("#page-control");
  const pageStatus = document.querySelector("#page-status");
  const previousPage = document.querySelector("#previous-page");
  const nextPage = document.querySelector("#next-page");

  if (
    !(printSheets instanceof HTMLElement) ||
    !(sheetStage instanceof HTMLElement) ||
    !(labelData instanceof HTMLTextAreaElement)
  ) {
    return;
  }

  const draftKey = "peta-sheet:draft:v1";
  const sessionKey = "peta-sheet:session:v1";
  const visitKey = "peta-sheet:last-visit:v1";
  const initialData = labelData.value;
  const defaultState = {
    activePage: 0,
    align: "left",
    data: initialData,
    font: "sans",
    fontSize: 11,
    offsetX: 0,
    offsetY: 0,
    preset: "address12",
    printBorder: false,
    repeatFirst: false,
  };
  const state = { ...defaultState };
  const tracked = new Set();
  let saveTimer = 0;

  const makeSessionId = () =>
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replaceAll(/[xy]/g, (character) => {
          const random = Math.floor(Math.random() * 16);
          const value = character === "x" ? random : (random & 0x3) | 0x8;
          return value.toString(16);
        });

  let sessionId = "";
  let lastVisit = "";
  const today = new Date().toISOString().slice(0, 10);
  try {
    sessionId = localStorage.getItem(sessionKey) ?? "";
    if (!sessionId) {
      sessionId = makeSessionId();
      localStorage.setItem(sessionKey, sessionId);
    }
    lastVisit = localStorage.getItem(visitKey) ?? "";
    localStorage.setItem(visitKey, today);
  } catch {
    sessionId = makeSessionId();
  }

  const track = (name) => {
    if (tracked.has(name)) {
      return;
    }
    tracked.add(name);
    void fetch("/api/events", {
      body: JSON.stringify({ name, sessionId }),
      headers: { "content-type": "application/json" },
      keepalive: true,
      method: "POST",
    }).catch(() => undefined);
  };

  const finiteNumber = (value, fallback, minimum, maximum) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.min(maximum, Math.max(minimum, numeric)) : fallback;
  };

  try {
    const stored = JSON.parse(localStorage.getItem(draftKey) ?? "null");
    if (stored && typeof stored === "object") {
      state.data =
        typeof stored.data === "string" && stored.data.length <= 200_000
          ? stored.data
          : defaultState.data;
      state.preset = Object.hasOwn(presets, stored.preset) ? stored.preset : defaultState.preset;
      state.align = stored.align === "center" ? "center" : "left";
      state.font = stored.font === "serif" ? "serif" : "sans";
      state.fontSize = finiteNumber(stored.fontSize, 11, 7, 18);
      state.offsetX = finiteNumber(stored.offsetX, 0, -5, 5);
      state.offsetY = finiteNumber(stored.offsetY, 0, -5, 5);
      state.printBorder = stored.printBorder === true;
      state.repeatFirst = stored.repeatFirst === true;
    }
  } catch {
    // A malformed device-local draft is ignored.
  }

  const saveDraft = () => {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            align: state.align,
            data: state.data.slice(0, 200_000),
            font: state.font,
            fontSize: state.fontSize,
            offsetX: state.offsetX,
            offsetY: state.offsetY,
            preset: state.preset,
            printBorder: state.printBorder,
            repeatFirst: state.repeatFirst,
          }),
        );
      } catch {
        // The editor still works for the current view when storage is unavailable.
      }
    }, 180);
  };

  const cleanCell = (value) =>
    Array.from(value)
      .filter((character) => {
        const code = character.codePointAt(0) ?? 0;
        return code > 31 && code !== 127;
      })
      .join("")
      .trim()
      .slice(0, 180);

  const parseCsv = (value) => {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];
      if (character === '"') {
        if (quoted && value[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === "," && !quoted) {
        row.push(field);
        field = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && value[index + 1] === "\n") {
          index += 1;
        }
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += character;
      }
    }
    row.push(field);
    rows.push(row);
    return rows;
  };

  const parseRows = (value) => {
    const rawRows = value.includes("\t")
      ? value.split(/\r?\n/).map((line) => line.split("\t"))
      : value.includes(",")
        ? parseCsv(value)
        : value.split(/\r?\n/).map((line) => [line]);

    return rawRows
      .map((row) => row.slice(0, 6).map(cleanCell))
      .filter((row) => row.some(Boolean))
      .slice(0, 650);
  };

  const setSelected = (selector, attribute, value) => {
    document.querySelectorAll(selector).forEach((button) => {
      if (button instanceof HTMLButtonElement) {
        const selected = button.dataset[attribute] === value;
        button.dataset.selected = String(selected);
        button.setAttribute("aria-pressed", String(selected));
      }
    });
  };

  const currentPreset = () => presets[state.preset] ?? presets.address12;

  const updateScale = () => {
    const a4WidthAtCssDpi = (210 / 25.4) * 96;
    const scale = sheetStage.clientWidth / a4WidthAtCssDpi;
    printSheets.style.setProperty("--sheet-scale", String(scale));
  };

  const makeLabel = (preset, pageIndex, slotIndex, row) => {
    const column = slotIndex % preset.columns;
    const rowIndex = Math.floor(slotIndex / preset.columns);
    const label = document.createElement("div");
    label.className = "label-cell";
    label.style.left = `${preset.left + column * (preset.width + preset.gapX) + state.offsetX}mm`;
    label.style.top = `${preset.top + rowIndex * (preset.height + preset.gapY) + state.offsetY}mm`;
    label.style.width = `${preset.width}mm`;
    label.style.height = `${preset.height}mm`;
    label.style.fontSize = `${state.fontSize}pt`;

    const number = document.createElement("span");
    number.className = "label-number";
    number.textContent = String(pageIndex * (preset.columns * preset.rows) + slotIndex + 1);
    label.append(number);
    row?.forEach((line) => {
      const text = document.createElement("span");
      text.className = "label-line";
      text.textContent = line;
      label.append(text);
    });
    return label;
  };

  const render = () => {
    const preset = currentPreset();
    const capacity = preset.columns * preset.rows;
    const rows = parseRows(state.data);
    const pageCount = state.repeatFirst ? 1 : Math.max(1, Math.ceil(rows.length / capacity));
    state.activePage = Math.min(state.activePage, pageCount - 1);
    printSheets.replaceChildren();
    printSheets.dataset.align = state.align;
    printSheets.dataset.font = state.font;
    printSheets.dataset.printBorder = String(state.printBorder);

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const page = document.createElement("div");
      page.className = "sheet-page";
      page.dataset.active = String(pageIndex === state.activePage);
      page.dataset.page = String(pageIndex);
      page.setAttribute("aria-label", `A4ラベル用紙 ${pageIndex + 1}ページ目`);

      for (let slotIndex = 0; slotIndex < capacity; slotIndex += 1) {
        const dataIndex = state.repeatFirst ? 0 : pageIndex * capacity + slotIndex;
        page.append(makeLabel(preset, pageIndex, slotIndex, rows[dataIndex]));
      }
      printSheets.append(page);
    }

    if (dataCount instanceof HTMLOutputElement) {
      dataCount.textContent = state.repeatFirst
        ? rows.length
          ? `${capacity}枚・1ページ`
          : `0件・1ページ`
        : `${rows.length}件・${pageCount}ページ`;
    }
    if (sheetDescription instanceof HTMLElement) {
      sheetDescription.textContent = `${preset.label}・${state.activePage + 1}/${pageCount}`;
    }
    if (pageControl instanceof HTMLElement) {
      pageControl.hidden = pageCount <= 1;
    }
    if (pageStatus instanceof HTMLOutputElement) {
      pageStatus.textContent = `${state.activePage + 1} / ${pageCount}`;
    }
    if (previousPage instanceof HTMLButtonElement) {
      previousPage.disabled = state.activePage === 0;
    }
    if (nextPage instanceof HTMLButtonElement) {
      nextPage.disabled = state.activePage === pageCount - 1;
    }
    if (fontSizeValue instanceof HTMLOutputElement) {
      fontSizeValue.textContent = `${state.fontSize} pt`;
    }

    updateScale();
  };

  const syncControls = () => {
    labelData.value = state.data;
    if (repeatFirst instanceof HTMLInputElement) {
      repeatFirst.checked = state.repeatFirst;
    }
    if (fontFamily instanceof HTMLSelectElement) {
      fontFamily.value = state.font;
    }
    if (fontSize instanceof HTMLInputElement) {
      fontSize.value = String(state.fontSize);
    }
    if (printBorder instanceof HTMLInputElement) {
      printBorder.checked = state.printBorder;
    }
    if (offsetX instanceof HTMLInputElement) {
      offsetX.value = String(state.offsetX);
    }
    if (offsetY instanceof HTMLInputElement) {
      offsetY.value = String(state.offsetY);
    }
    setSelected("[data-preset]", "preset", state.preset);
    setSelected("[data-align]", "align", state.align);
  };

  const adjusted = () => {
    state.activePage = 0;
    saveDraft();
    render();
    track("adjusted");
  };

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button instanceof HTMLButtonElement && Object.hasOwn(presets, button.dataset.preset)) {
        state.preset = button.dataset.preset;
        setSelected("[data-preset]", "preset", state.preset);
        adjusted();
      }
    });
  });

  document.querySelectorAll("[data-align]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button instanceof HTMLButtonElement) {
        state.align = button.dataset.align === "center" ? "center" : "left";
        setSelected("[data-align]", "align", state.align);
        adjusted();
      }
    });
  });

  labelData.addEventListener("input", () => {
    state.data = labelData.value;
    state.activePage = 0;
    saveDraft();
    render();
    track("edited");
  });
  repeatFirst?.addEventListener("change", () => {
    if (repeatFirst instanceof HTMLInputElement) {
      state.repeatFirst = repeatFirst.checked;
      adjusted();
    }
  });
  fontFamily?.addEventListener("change", () => {
    if (fontFamily instanceof HTMLSelectElement) {
      state.font = fontFamily.value === "serif" ? "serif" : "sans";
      adjusted();
    }
  });
  fontSize?.addEventListener("input", () => {
    if (fontSize instanceof HTMLInputElement) {
      state.fontSize = finiteNumber(fontSize.value, 11, 7, 18);
      adjusted();
    }
  });
  printBorder?.addEventListener("change", () => {
    if (printBorder instanceof HTMLInputElement) {
      state.printBorder = printBorder.checked;
      adjusted();
    }
  });
  offsetX?.addEventListener("input", () => {
    if (offsetX instanceof HTMLInputElement) {
      state.offsetX = finiteNumber(offsetX.value, 0, -5, 5);
      adjusted();
    }
  });
  offsetY?.addEventListener("input", () => {
    if (offsetY instanceof HTMLInputElement) {
      state.offsetY = finiteNumber(offsetY.value, 0, -5, 5);
      adjusted();
    }
  });

  previousPage?.addEventListener("click", () => {
    state.activePage = Math.max(0, state.activePage - 1);
    render();
  });
  nextPage?.addEventListener("click", () => {
    state.activePage += 1;
    render();
  });
  printButton?.addEventListener("click", () => {
    track("printed");
    window.requestAnimationFrame(() => window.print());
  });
  resetButton?.addEventListener("click", () => {
    if (!window.confirm("入力した文字と設定を初期状態に戻しますか？")) {
      return;
    }
    Object.assign(state, defaultState);
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // No device-local draft remains when storage is unavailable.
    }
    syncControls();
    render();
  });

  syncControls();
  render();
  track("visited");
  if (lastVisit && lastVisit !== today) {
    track("returned");
  }

  if (typeof ResizeObserver === "function") {
    new ResizeObserver(updateScale).observe(sheetStage);
  } else {
    window.addEventListener("resize", updateScale, { passive: true });
  }
})();
