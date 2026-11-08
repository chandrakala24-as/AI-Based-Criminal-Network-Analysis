from typing import List
from fastapi import Depends, HTTPException, status
from app.models.user import User, UserRole
from app.security.auth import get_current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User with role '{user.role}' is not authorized to perform this operation. Required roles: {[r.value for r in self.allowed_roles]}"
            )
        return user

# Pre-configured role checks
require_admin = RoleChecker([UserRole.ADMIN])
require_investigator = RoleChecker([UserRole.ADMIN, UserRole.INVESTIGATOR])
require_analyst = RoleChecker([UserRole.ADMIN, UserRole.INVESTIGATOR, UserRole.ANALYST])
require_any_user = RoleChecker([UserRole.ADMIN, UserRole.INVESTIGATOR, UserRole.ANALYST, UserRole.VIEWER])
