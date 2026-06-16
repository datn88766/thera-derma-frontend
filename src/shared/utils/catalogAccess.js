export function canManageCatalog(role) {
  return role === 'admin' || role === 'staff' || role === 'super_admin';
}

export function getCatalogAdminPath(role) {
  return role === 'staff' ? '/staff/services' : '/admin/services';
}
