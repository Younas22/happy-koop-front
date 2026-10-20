"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { deleteAdminUserAction, saveAdminUserAction } from "@/app/admin/actions";
import { AdminTableWrap, Td, Th } from "@/components/admin/AdminParts";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import type { AdminUserSummary } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/datetime";

/**
 * Admin user management.
 *
 * Role slugs come from the roles actually present on the loaded accounts - the
 * contract exposes no endpoint that lists available roles, so nothing is
 * invented here. A slug can also be typed in, and an unknown one is rejected
 * by the API with a 422 that is shown on the form.
 *
 * The API refuses to let an admin delete themselves or drop their own admin
 * role; that refusal is surfaced rather than hidden by disabling the control
 * on a guess about identity.
 */
export function AdminUserManager({
  users,
  viewerId,
  locale,
  timeZone,
}: {
  users: readonly AdminUserSummary[];
  viewerId: number;
  locale: string;
  timeZone: string;
}) {
  const router = useRouter();

  const knownRoles = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const user of users) {
      for (const role of user.roles) map.set(role.slug, role.name);
    }
    return [...map.entries()].map(([slug, name]) => ({ slug, name }));
  }, [users]);

  const [editing, setEditing] = React.useState<{ open: boolean; user: AdminUserSummary | null }>({
    open: false,
    user: null,
  });
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [roleSlugs, setRoleSlugs] = React.useState<string[]>([]);
  const [extraRoles, setExtraRoles] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [deleting, setDeleting] = React.useState<AdminUserSummary | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  function open(user: AdminUserSummary | null) {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setPassword("");
    setRoleSlugs(user?.roles.map((role) => role.slug) ?? []);
    setExtraRoles("");
    setFormError(null);
    setEditing({ open: true, user });
  }

  async function save() {
    setSaving(true);
    setFormError(null);

    const typed = extraRoles
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean);
    const slugs = [...new Set([...roleSlugs, ...typed])];

    const body: Record<string, unknown> = {
      name,
      phone: phone.trim() || null,
      roleSlugs: slugs,
    };

    if (editing.user === null) {
      body.email = email.trim().toLowerCase();
      body.password = password;
    } else if (password.trim() !== "") {
      // Only sent when the admin deliberately typed a new password.
      body.password = password;
    }

    const result = await saveAdminUserAction(editing.user?.id ?? null, body);

    // The password never lingers in state after a submit.
    setPassword("");
    setSaving(false);

    if (!result.ok) {
      const details = flattenFieldErrors(result.error.errors);
      setFormError(details.length > 0 ? details.join(" ") : result.error.message);
      return;
    }

    setEditing({ open: false, user: null });
    toast.success(editing.user ? "User saved." : "User created.");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);

    const result = await deleteAdminUserAction(deleting.id);
    setDeleteBusy(false);

    if (!result.ok) {
      setDeleteError(result.error.message);
      return;
    }

    setDeleting(null);
    toast.success("User deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => open(null)}>
          <Plus className="size-4" aria-hidden="true" />
          New user
        </Button>
      </div>

      <AdminTableWrap>
        <thead>
          <tr>
            <Th>User</Th>
            <Th>Roles</Th>
            <Th className="text-right">Orders</Th>
            <Th>Last sign-in</Th>
            <Th>Joined</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <Td>
                <span className="font-medium text-ink">{user.name}</span>
                <span className="block break-words text-xs text-ink-muted">{user.email}</span>
                {user.id === viewerId ? (
                  <Badge tone="brand" className="mt-1">
                    You
                  </Badge>
                ) : null}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  {user.roles.length === 0 ? (
                    <span className="text-xs text-ink-muted">Customer</span>
                  ) : (
                    user.roles.map((role) => (
                      <Badge key={role.id} tone={user.isAdmin ? "info" : "neutral"}>
                        {role.name}
                      </Badge>
                    ))
                  )}
                </div>
              </Td>
              <Td className="text-right tabular-nums">{user.ordersCount}</Td>
              <Td>{formatDate(user.lastLoginAt, { locale, timeZone }) ?? "Never"}</Td>
              <Td>{formatDate(user.createdAt, { locale, timeZone }) ?? "-"}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => open(user)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleting(user);
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </AdminTableWrap>

      <Dialog
        open={editing.open}
        onOpenChange={(open) => setEditing((state) => ({ ...state, open }))}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing.user ? "Edit user" : "New user"}</DialogTitle>
            <DialogDescription>
              Roles decide what the API allows this account to do.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {formError ? (
              <Alert tone="danger" live title="The user was not saved">
                {formError}
              </Alert>
            ) : null}

            <FormField id="user-name" label="Name" required>
              {(field) => (
                <Input
                  {...field}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              )}
            </FormField>

            <FormField
              id="user-email"
              label="Email address"
              required={editing.user === null}
              description={
                editing.user ? "The email address cannot be changed from here." : undefined
              }
            >
              {(field) => (
                <Input
                  {...field}
                  type="email"
                  autoComplete="off"
                  value={email}
                  readOnly={editing.user !== null}
                  disabled={editing.user !== null}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </FormField>

            <FormField id="user-phone" label="Phone">
              {(field) => (
                <Input
                  {...field}
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              )}
            </FormField>

            <FormField
              id="user-password"
              label={editing.user ? "New password" : "Password"}
              required={editing.user === null}
              description={
                editing.user
                  ? "Leave blank to keep the current password."
                  : "At least 8 characters, including a letter and a number."
              }
            >
              {(field) => (
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              )}
            </FormField>

            <fieldset>
              <legend className="mb-1 text-sm font-medium text-ink">Roles</legend>
              {knownRoles.length === 0 ? (
                <p className="text-xs text-ink-muted">
                  No roles are visible on the loaded accounts. Enter the slugs below.
                </p>
              ) : (
                <ul className="grid gap-1 sm:grid-cols-2">
                  {knownRoles.map((role) => (
                    <li key={role.slug}>
                      <CheckboxField
                        id={`role-${role.slug}`}
                        label={`${role.name} (${role.slug})`}
                        checked={roleSlugs.includes(role.slug)}
                        onCheckedChange={(checked) =>
                          setRoleSlugs((current) =>
                            checked === true
                              ? [...current, role.slug]
                              : current.filter((slug) => slug !== role.slug),
                          )
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <FormField
              id="user-extra-roles"
              label="Additional role slugs"
              description="Comma separated. An unknown slug is rejected by the API."
            >
              {(field) => (
                <Input
                  {...field}
                  value={extraRoles}
                  onChange={(event) => setExtraRoles(event.target.value)}
                />
              )}
            </FormField>
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing({ open: false, user: null })}>
              Cancel
            </Button>
            <Button loading={saving} loadingLabel="Saving…" onClick={() => void save()}>
              {editing.user ? "Save user" : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title="Delete this user?"
        recordName={deleting ? `${deleting.name} (${deleting.email})` : ""}
        description="The account is removed. Orders they placed keep their own records. The API refuses to delete your own account."
        confirmLabel="Delete user"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
