const fs = require('fs');
let code = fs.readFileSync('src/components/AssetManagement.tsx', 'utf8');

// 1. Replace states
code = code.replace(
  "const [viewingAsset, setViewingAsset] = useState<IAsset | null>(null);\n  const [showViewModal, setShowViewModal] = useState(false);",
  "const [isViewMode, setIsViewMode] = useState(false);"
);

// 2. Update openEditModal & openViewModal
code = code.replace(
  /const openEditModal = \(asset: IAsset\) => \{[\s\S]*?const openViewModal = \(asset: IAsset\) => \{[\s\S]*?setShowViewModal\(true\);\n  \};/,
  `const openEditModal = (asset: IAsset, view: boolean = false) => {
    setEditingAsset(asset);
    setFormData({
      device_code: asset.device_code || '',
      asset_id: asset.asset_id,
      name: asset.name,
      category: asset.category,
      brand: asset.brand || '',
      specs: asset.specs || '',
      serial_number: asset.serial_number || '',
      department: asset.department || '',
      usage_status: asset.usage_status || 'karyawan',
      assigned_to: asset.assigned_to || '',
      user_index: asset.user_index || '',
      status: asset.status || 'Active',
      condition: asset.condition || 'Good',
      notes: asset.notes || ''
    });
    setIsViewMode(view);
    setShowModal(true);
  };`
);

// 3. Update table calls
code = code.replace(/onClick=\{\(\) => openViewModal\(asset\)\}/g, "onClick={() => openEditModal(asset, true)}");

// 4. Add Button
code = code.replace(
  /resetForm\(\);\n\s*setEditingAsset\(null\);\n\s*setShowModal\(true\);/g,
  "resetForm();\n              setEditingAsset(null);\n              setIsViewMode(false);\n              setShowModal(true);"
);

// 5. Update showModal rendering
// Replace `showModal && (` to `showModal && !isViewMode && (` (Wait, actually I want one modal, let's keep showModal)
// We will replace the `<form ...>` block with `{isViewMode ? <viewJSX> : <formJSX>}`

// Let's do it manually with sed or string replacements for the view part.
fs.writeFileSync('src/components/AssetManagement.tsx', code);
