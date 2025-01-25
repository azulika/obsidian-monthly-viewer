# Obsidian Monthly Viewer


**Displays a monthly list of notes in a side panel.**



## Features

- **Monthly Note Organization:**  View your notes organized by year and month in a dedicated side panel.
- **Date-Based Listing:**  Automatically groups notes based on their creation date or dates extracted from specified frontmatter keys.
- **Customizable Date Keys:**  Configure which frontmatter keys the plugin should look for to determine a note's date. This allows flexibility for different note-taking workflows.
- **Sorting Options:** Sort notes within each month by:
    - **Date:** (Default) Based on the configured date keys or file creation time.
    - **Name:** Alphabetically by note title.
    - **Created:** By the file's creation timestamp.
    - **Sort Order:** Choose between ascending or descending order for sorting.
- **Tag Filtering:** Filter the displayed notes by specific tags. Select tags from a dropdown list populated with tags found in your vault.
- **Side Panel Placement:** Choose to display the Monthly Viewer panel on the left or right side of your Obsidian workspace.
- **Ribbon Icon & Command:** Easily toggle the Monthly Viewer panel using a ribbon icon or a dedicated command.

##  How to Install

### From within Obsidian (Recommended)

1. Open Obsidian Settings (`Ctrl+,` or `Cmd+,` on macOS).
2. Go to "Community plugins".
3. Click "Browse" and search for "Monthly Viewer".
4. Click "Install" on the "Monthly Viewer" plugin.
5. After installation, go to the "Installed plugins" tab and enable "Monthly Viewer".

### Manually

1. Download the latest release from [TODO: Add your release link here if you have one, e.g., GitHub Releases].
2. Extract the downloaded ZIP file to your Obsidian vault's plugins folder: `<your_vault>/.obsidian/plugins/obsidian-monthly-viewer`.
   - **Note**: On macOS, the `.obsidian` folder might be hidden. Press `Cmd+Shift+.` to show hidden folders in Finder.
3. In Obsidian, go to "Settings" -> "Community plugins" and enable "Monthly Viewer".

## How to Use

1. **Navigate and Explore:**
   - The Monthly Viewer panel will display notes grouped by year and month.
   - Click on a note title to open it in a new pane.

2. **Filter and Sort:**
   - **Filter by Tags:** Use the "Filter by tags" dropdown in the panel header to select a tag. Only notes containing the selected tag will be displayed.
   - **Sort By:** Use the "Sort by" dropdown to choose how notes within each month are sorted (Date, Name, Created).
   - **Sort Order:** Use the "Order" dropdown to select ascending or descending sort order.

## Settings

You can configure the Monthly Viewer plugin in the Obsidian settings under "Community plugins" -> "Monthly Viewer".

- **Date Frontmatter Keys:**
    -  Enter a comma-separated list of frontmatter keys that the plugin should check to determine a note's date.
    -  The plugin will prioritize these keys in the order they are listed. If a valid date is found in one of these keys, it will be used.
    -  If no valid date is found in the specified frontmatter keys, the plugin will fall back to using the note's creation date.
    -  **Example:** `datetimeCreate, createdDate, date`

- **Side Panel Position:**
    - Choose whether the Monthly Viewer panel should appear on the "Left" or "Right" side of your Obsidian workspace.