import { useSelector } from 'react-redux'

export const ROLE_PERMISSIONS = {
  admin: {
    canCreateUsers: false,
    canUpdateUsers: false,
    canDeleteUsers: false,
    canViewUsers: true,
    canCreateGroups: false,
    canUpdateGroups: false,
    canDeleteGroups: false,
    canViewGroups: true,
  },
  viewer: {
    canCreateUsers: false,
    canUpdateUsers: false,
    canDeleteUsers: false,
    canViewUsers: true,
    canCreateGroups: false,
    canUpdateGroups: false,
    canDeleteGroups: false,
    canViewGroups: true,
  },
  manager: {
    canCreateUsers: false,
    canUpdateUsers: true,
    canDeleteUsers: false,
    canViewUsers: true,
    canCreateGroups: true,
    canUpdateGroups: true,
    canDeleteGroups: false,
    canViewGroups: true,
  },
}

export const userPermission = () => {
  const user = useSelector((state) => state.userDetails);
  return ROLE_PERMISSIONS[user?.role] || {};
}