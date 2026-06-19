const {
  Plugin,
  WorkspaceLeaf,
  ItemView,
  moment,
  Setting,
  PluginSettingTab,
  TFile,
  addIcon,
  debounce,
} = require("obsidian");

const DEFAULT_SETTINGS = {
  dateKeys: ["datetimeCreate", "createdDate"],
  side: "right",
  viewParams: {
    filterTags: [],
    filterFrontmatterKeys: [],
    filterFolder: "",
    sortBy: "date",
    sortOrder: "desc"
  }
};

const VIEW_TYPE_MONTHLY = "monthly-view";

class MonthlyView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentSortBy = this.plugin.settings.viewParams.sortBy;
    this.currentSortOrder = this.plugin.settings.viewParams.sortOrder;
    this.currentFilterTags = this.plugin.settings.viewParams.filterTags;
    this.currentFilterFrontmatterKeys = this.plugin.settings.viewParams.filterFrontmatterKeys;
    this.currentFilterFolder = this.plugin.settings.viewParams.filterFolder || "";
    this.expandedMonths = new Set();
  }

  getViewType() {
    return VIEW_TYPE_MONTHLY;
  }

  getDisplayText() {
    return "Monthly View";
  }

  getIcon() {
    // Placeholder icon: Replace with your desired icon
    return "calendar-days";
  }

  async onOpen() {
    this.updateView();
  }

  async onClose() {
    // Nothing to clean up.
  }

  createFilterAndSortHeader(container) {
    const headerEl = container.createEl("div", { cls: "monthly-view-header" });

    // --- Filter Section ---
    const filterSection = headerEl.createEl("div", {
      cls: "monthly-view-filter-section",
    });

    // Filter by tags row
    const tagFilterRow = filterSection.createEl("div", {
      cls: "monthly-view-filter-row",
    });
    tagFilterRow.createEl("label", {
      text: "Tags:",
      cls: "monthly-view-filter-label",
    });
    const tagFilterDropdown = tagFilterRow.createEl("select", {
      cls: "monthly-view-filter-dropdown",
    });
    tagFilterDropdown.createEl("option", {
      value: "",
      text: "Filter by tags...",
    }); // Default option
    const { tags, frontmatterKeys } =
      this.plugin.getExistingTagsAndFrontmatterKeys();
    for (const tag of Object.keys(tags).sort()) {
      tagFilterDropdown.createEl("option", { value: tag, text: tag });
    }
    tagFilterDropdown.value = this.currentFilterTags[0] || "";
    tagFilterDropdown.addEventListener("change", async () => {
      this.currentFilterTags = tagFilterDropdown.value
        ? [tagFilterDropdown.value]
        : [];
      this.plugin.settings.viewParams.filterTags = this.currentFilterTags;
      this.expandedMonths.clear();
      await this.plugin.saveSettings();
      this.updateView();
    });

    // Filter by folder row
    const folderFilterRow = filterSection.createEl("div", {
      cls: "monthly-view-filter-row",
    });
    folderFilterRow.createEl("label", {
      text: "Folder:",
      cls: "monthly-view-filter-label",
    });
    const folderFilterDropdown = folderFilterRow.createEl("select", {
      cls: "monthly-view-filter-dropdown",
    });
    folderFilterDropdown.createEl("option", {
      value: "",
      text: "Filter by folder...",
    });
    const folders = this.plugin.getExistingFolders();
    for (const folder of folders) {
      folderFilterDropdown.createEl("option", {
        value: folder,
        text: folder === "" ? "/ (vault root)" : folder,
      });
    }
    folderFilterDropdown.value = this.currentFilterFolder || "";
    folderFilterDropdown.addEventListener("change", async () => {
      this.currentFilterFolder = folderFilterDropdown.value;
      this.plugin.settings.viewParams.filterFolder = this.currentFilterFolder;
      this.expandedMonths.clear();
      await this.plugin.saveSettings();
      this.updateView();
    });

    // // Filter by frontmatter label and dropdown
    // filterSection.createEl("label", {
    //   text: "Filter by frontmatter keys:",
    //   cls: "monthly-view-filter-label",
    // });
    // const fmFilterDropdown = filterSection.createEl("select", {
    //   cls: "monthly-view-filter-dropdown",
    // });
    // fmFilterDropdown.createEl("option", {
    //   value: "",
    //   text: "Filter by frontmatter keys...",
    // }); // Default option
    // for (const key of frontmatterKeys.sort()) {
    //   fmFilterDropdown.createEl("option", { value: key, text: key });
    // }
    // fmFilterDropdown.value = this.currentFilterFrontmatterKeys[0] || "";
    // fmFilterDropdown.addEventListener("change", async () => {
    //   this.currentFilterFrontmatterKeys = fmFilterDropdown.value
    //     ? [fmFilterDropdown.value]
    //     : [];
    //   this.plugin.settings.viewParams.filterFrontmatterKeys = this.currentFilterFrontmatterKeys;
    //   await this.plugin.saveSettings();
    //   this.updateView();
    // });

    // --- Sort Section ---
    const sortSection = headerEl.createEl("div", {
      cls: "monthly-view-sort-section",
    });

    // Sort by label and dropdown
    sortSection.createEl("label", {
      text: "Sort by:",
      cls: "monthly-view-sort-label",
    });
    const sortByDropdown = sortSection.createEl("select");
    const sortByOptions = ["date", "name", "created"];
    for (const option of sortByOptions) {
      const optionEl = document.createElement("option");
      optionEl.value = option;
      optionEl.text = option.charAt(0).toUpperCase() + option.slice(1);
      sortByDropdown.appendChild(optionEl);
    }
    sortByDropdown.value = this.currentSortBy;
    sortByDropdown.addEventListener("change", async () => {
      this.currentSortBy = sortByDropdown.value;
      this.plugin.settings.viewParams.sortBy = this.currentSortBy;
      await this.plugin.saveSettings();
      this.updateView();
    });

    // Sort order label and dropdown
    sortSection.createEl("label", {
      text: "Order:",
      cls: "monthly-view-sort-label",
    });
    const sortOrderDropdown = sortSection.createEl("select");
    const sortOrderOptions = ["asc", "desc"];
    for (const option of sortOrderOptions) {
      const optionEl = document.createElement("option");
      optionEl.value = option;
      optionEl.text = option === "asc" ? "Ascending" : "Descending";
      sortOrderDropdown.appendChild(optionEl);
    }
    sortOrderDropdown.value = this.currentSortOrder;
    sortOrderDropdown.addEventListener("change", async () => {
      this.currentSortOrder = sortOrderDropdown.value;
      this.plugin.settings.viewParams.sortOrder = this.currentSortOrder;
      await this.plugin.saveSettings();
      this.updateView();
    });
  }

  updateView() {
    const container = this.containerEl.children[1];
    container.empty();

    // Add filter and sort header
    this.createFilterAndSortHeader(container);

    let files = this.plugin.getFilteredFiles(
      this.currentFilterTags,
      this.currentFilterFrontmatterKeys,
      this.currentFilterFolder
    );
    // Decorate each file with its date once, sort, then group. This keeps
    // getDate() (which reads the metadata cache and builds moment objects)
    // at O(N) instead of being re-invoked O(N log N) times during sorting.
    const items = this.plugin.sortFiles(
      files,
      this.currentSortBy,
      this.currentSortOrder
    );
    const groupedFiles = this.plugin.groupFilesByMonth(items);

    const contentEl = container.createEl("div");

    if (Object.keys(groupedFiles).length === 0) {
      contentEl.createEl("div", {
        text: "No notes found for the current filter/sort criteria.",
        cls: "monthly-view-empty",
      });
      return;
    }

    const years = Object.keys(groupedFiles).sort((a, b) => {
      return this.currentSortOrder === "asc" ? a - b : b - a;
    });

    for (const year of years) {
      contentEl.createEl("h2", { text: year, cls: "monthly-view-year-heading" });

      const months = Object.keys(groupedFiles[year]).sort((a, b) => {
        return this.currentSortOrder === "asc"
          ? Number(a) - Number(b)
          : Number(b) - Number(a);
      });

      const monthRow = contentEl.createEl("div", {
        cls: "monthly-view-month-row",
      });

      for (const month of months) {
        const key = `${year}-${month}`;
        const monthBtn = monthRow.createEl("span", {
          text: month,
          cls: "monthly-view-month-btn",
        });

        const tableHolder = contentEl.createEl("div", {
          cls: "monthly-view-month-table-holder",
        });

        const renderTable = () => {
          tableHolder.empty();
          const table = tableHolder.createEl("table", {
            cls: "monthly-view-table",
          });
          const thead = table.createTHead();
          const headerRow = thead.insertRow();
          headerRow.createEl("th", { text: "Title", cls: "monthly-view-title-header" });
          headerRow.createEl("th", { text: "Created Date", cls: "monthly-view-date-header" });

          const tbody = table.createTBody();
          for (const { file, date } of groupedFiles[year][month]) {
            const row = tbody.insertRow();

            const titleCell = row.createEl("td", { cls: "monthly-view-title-cell" });
            const titleLink = titleCell.createEl("a", {
              text: file.basename,
              cls: "monthly-view-title-link",
            });
            titleLink.addEventListener("click", () => {
              this.app.workspace.getLeaf().openFile(file);
            });

            const createdDateCell = row.createEl("td", {
              cls: "monthly-view-date-cell",
            });

            createdDateCell.textContent = moment(date).format("M/D");
          }
        };

        if (this.expandedMonths.has(key)) {
          monthBtn.addClass("is-expanded");
          renderTable();
        }

        monthBtn.addEventListener("click", () => {
          if (this.expandedMonths.has(key)) {
            this.expandedMonths.delete(key);
            monthBtn.removeClass("is-expanded");
            tableHolder.empty();
          } else {
            this.expandedMonths.add(key);
            monthBtn.addClass("is-expanded");
            renderTable();
          }
        });
      }
    }
  }

  // Helper function to shorten large numbers
  shortenNumber(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  }
}

module.exports = class MonthlyViewerPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    // Coalesce bursts of structural changes (e.g. bulk create/delete during a
    // vault sync or import) into a single re-render instead of one per file.
    this.scheduleUpdate = debounce(() => this.updateView(), 300, true);

    this.addSettingTab(new MonthlyViewerSettingTab(this.app, this));

    // Placeholder for the icon: Replace with your actual icon
    addIcon("calendar-days", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-calendar"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M3 10h18"></path></svg>`);

    this.registerView(
      VIEW_TYPE_MONTHLY,
      (leaf) => new MonthlyView(leaf, this)
    );

    this.addCommand({
      id: "show-monthly-view",
      name: "Show Monthly View",
      callback: () => this.activateView(),
    });

    this.addRibbonIcon("calendar-days", "Open Monthly View", () => {
      this.activateView();
    });

    // Only re-render when the set of notes actually changes. We deliberately
    // do NOT listen to "modify": editing/saving a note (which Obsidian also
    // fires for the previous note every time you switch notes) never changes
    // its creation date, so it cannot affect this view's grouping — listening
    // to it just caused a full re-render on every note open.
    this.registerEvent(
      this.app.vault.on("create", () => this.scheduleUpdate())
    );
    this.registerEvent(
      this.app.vault.on("delete", () => this.scheduleUpdate())
    );
    this.registerEvent(
      this.app.vault.on("rename", () => this.scheduleUpdate())
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MONTHLY);

    const leaf =
      this.settings.side === "left"
        ? this.app.workspace.getLeftLeaf(false)
        : this.app.workspace.getRightLeaf(false);

    await leaf.setViewState({
      type: VIEW_TYPE_MONTHLY,
      active: true,
    });

    this.app.workspace.revealLeaf(leaf);
  }

  updateView() {
    const monthlyView = this.app.workspace
      .getLeavesOfType(VIEW_TYPE_MONTHLY)
      .find((leaf) => leaf.view instanceof MonthlyView);
    if (monthlyView) {
      monthlyView.view.updateView();
    }
  }

  getFilteredFiles(filterTags, filterFrontmatterKeys, filterFolder) {
    let files = this.app.vault.getMarkdownFiles();

    // Filter by folder (includes subfolders)
    if (filterFolder) {
      const prefix = filterFolder.endsWith("/") ? filterFolder : filterFolder + "/";
      files = files.filter((file) => {
        const parentPath = file.parent?.path ?? "";
        return parentPath === filterFolder || parentPath.startsWith(prefix);
      });
    }

    // Filter by tags (frontmatter and inline)
    if (filterTags.length > 0) {
      files = files.filter((file) => {
        const cache = this.app.metadataCache.getFileCache(file);
        if (!cache) return false; // Add null check here, if cache is null, file should not be included

        // Correct handling of frontmatter tags (undefined, string, or array)
        const frontmatterTags = cache.frontmatter?.tags;
        const fmTags = Array.isArray(frontmatterTags)
          ? frontmatterTags.map((tag) => tag.toLowerCase())
          : typeof frontmatterTags === "string"
            ? [frontmatterTags.toLowerCase()]
            : [];

        const inlineTags = (cache.tags || []).map((t) =>
          t.tag.replace(/^#/, "").toLowerCase()
        );
        const allTags = [...fmTags, ...inlineTags];

        return filterTags.some((tag) => allTags.includes(tag));
      });
    }

    // Filter by frontmatter keys
    if (filterFrontmatterKeys.length > 0) {
      files = files.filter((file) => {
        const cache = this.app.metadataCache.getFileCache(file);
        if (!cache) return false; // Add null check here, if cache is null, file should not be included

        const frontmatter = cache.frontmatter || {};
        return filterFrontmatterKeys.some((key) =>
          Object.prototype.hasOwnProperty.call(frontmatter, key)
        );
      });
    }

    return files;
  }

  // Get date from frontmatter or file creation time
  getDate(file) {
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter || {}; // Use optional chaining

    for (const key of this.settings.dateKeys) {
      if (frontmatter[key]) {
        const date = moment(frontmatter[key]);
        if (date.isValid()) {
          return date.valueOf();
        }
      }
    }

    // Fallback to file creation time
    return file.stat.ctime;
  }

  // Returns an array of { file, date } items, sorted. getDate() is evaluated
  // exactly once per file here (decorate-sort-undecorate) rather than inside
  // the comparator, where it would run O(N log N) times.
  sortFiles(files, sortBy, sortOrder) {
    const items = files.map((file) => ({ file, date: this.getDate(file) }));
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return sortOrder === "asc"
            ? a.file.basename.localeCompare(b.file.basename)
            : b.file.basename.localeCompare(a.file.basename);
        case "created":
          return sortOrder === "asc"
            ? a.file.stat.ctime - b.file.stat.ctime
            : b.file.stat.ctime - a.file.stat.ctime;
        case "date":
        default:
          return sortOrder === "asc" ? a.date - b.date : b.date - a.date;
      }
    });
    return items;
  }

  // Accepts the { file, date } items produced by sortFiles and groups them by
  // year/month, preserving the precomputed date so callers need not recompute.
  groupFilesByMonth(items) {
    const grouped = {};
    for (const item of items) {
      const year = moment(item.date).format("YYYY");
      const month = moment(item.date).format("M");

      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = [];
      }
      grouped[year][month].push(item);
    }
    return grouped;
  }

  getExistingFolders() {
    const folderSet = new Set();
    for (const file of this.app.vault.getMarkdownFiles()) {
      const path = file.parent?.path ?? "";
      folderSet.add(path);
    }
    return Array.from(folderSet).sort((a, b) => a.localeCompare(b));
  }

  getExistingTagsAndFrontmatterKeys() {
    const tags = {};
    const frontmatterKeys = new Set();

    for (const file of this.app.vault.getMarkdownFiles()) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache) {
        continue; // Skip to the next file if cache is null
      }

      // Frontmatter tags
      const frontmatterTags = cache.frontmatter?.tags;
      const fmTags = Array.isArray(frontmatterTags)
        ? frontmatterTags
        : typeof frontmatterTags === "string"
          ? frontmatterTags.split(",").map((tag) => tag.trim()) // Split by comma and trim
          : [];

      for (let tag of fmTags) {
        tag = tag.replace(/^#/, "").toLowerCase(); // Remove # and lowercase
        const nestedTags = tag.split("/"); // Split nested tags
        for (const nestedTag of nestedTags) {
          tags[nestedTag] = (tags[nestedTag] || 0) + 1;
        }
      }

      // Inline tags
      const inlineTags = (cache.tags || []).map((t) => t.tag.replace(/^#/, ""));
      for (let tag of inlineTags) {
        tag = tag.toLowerCase();
        const nestedTags = tag.split("/"); // Split nested tags
        for (const nestedTag of nestedTags) {
          tags[nestedTag] = (tags[nestedTag] || 0) + 1;
        }
      }

      // Frontmatter keys
      const fileFrontmatter = cache.frontmatter || {};
      for (const key in fileFrontmatter) {
        frontmatterKeys.add(key);
      }
    }

    return { tags, frontmatterKeys: Array.from(frontmatterKeys) };
  }
};

class MonthlyViewerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Date Frontmatter Keys")
      .setDesc(
        "Comma-separated list of frontmatter keys to check for dates (e.g., datetimeCreate, createdDate)"
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter keys separated by commas")
          .setValue(this.plugin.settings.dateKeys.join(","))
          .onChange(async (value) => {
            this.plugin.settings.dateKeys = value
              .split(",")
              .map((key) => key.trim());
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Side Panel Position")
      .setDesc("Choose the side for the Monthly Viewer panel")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("left", "Left")
          .addOption("right", "Right")
          .setValue(this.plugin.settings.side)
          .onChange(async (value) => {
            this.plugin.settings.side = value;
            await this.plugin.saveSettings();
          })
      );
  }
}