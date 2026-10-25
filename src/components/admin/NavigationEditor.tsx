"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { saveNavigationAction } from "@/app/admin/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { flattenFieldErrors } from "@/lib/forms/api-errors";
import type { RuntimeNavigation } from "@/lib/types/api";

/**
 * Header and footer navigation editor.
 *
 * The public runtime config has always carried `navigation.primary` and
 * `navigation.footer`, and the API has always accepted writes to both - but
 * there was no screen for them, so the storefront's header and footer links
 * were whatever the seeder had written and an administrator could not change
 * them. This is that screen.
 *
 * The limits below are the server's own (`StoreSettingsRequest`): exceeding
 * them is a 422, so the form stops it here and says why. The same request
 * requires a label and an href on every row and at least one link in every
 * footer group, which is why an incomplete row cannot be saved.
 *
 * Saving sends only `navigation`, so no other store setting is touched, and
 * the action then refreshes the cached public runtime config - the storefront
 * picks the new links up immediately instead of waiting out the 60s window.
 */

const MAX_PRIMARY = 12;
const MAX_GROUPS = 6;
const MAX_GROUP_LINKS = 12;
const MAX_LABEL = 60;
const MAX_HREF = 255;

const HREF_HINT = "Use a path such as /shop, /category/kitchen or /pages/about.";

interface LinkDraft {
  label: string;
  /** Dutch label; empty means "use the English one". */
  labelNl: string;
  href: string;
}

interface GroupDraft {
  heading: string;
  headingNl: string;
  links: LinkDraft[];
}

function toLinkDraft(link: RuntimeNavigation["primary"][number]): LinkDraft {
  return { label: link.label, labelNl: link.labels?.nl ?? "", href: link.href };
}

/** A per-language map for the API, or `null` when no translation was written. */
function translations(nl: string): { nl: string } | null {
  const value = nl.trim();
  return value === "" ? null : { nl: value };
}

function toDrafts(navigation: RuntimeNavigation): { primary: LinkDraft[]; footer: GroupDraft[] } {
  return {
    primary: navigation.primary.map(toLinkDraft),
    footer: navigation.footer.map((group) => ({
      heading: group.heading,
      headingNl: group.headings?.nl ?? "",
      links: group.links.map(toLinkDraft),
    })),
  };
}

/** Moves an item within a list, returning a new list. */
function move<T>(items: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * The problems that would make the server reject the payload, in the admin's
 * words rather than as a list of validation keys.
 */
function problems(primary: readonly LinkDraft[], footer: readonly GroupDraft[]): string[] {
  const found: string[] = [];

  primary.forEach((link, index) => {
    if (link.label.trim() === "" || link.href.trim() === "") {
      found.push(`Header link ${index + 1} needs both a label and a link.`);
    }
  });

  footer.forEach((group, groupIndex) => {
    if (group.heading.trim() === "") {
      found.push(`Footer column ${groupIndex + 1} needs a heading.`);
    }
    if (group.links.length === 0) {
      found.push(`Footer column ${groupIndex + 1} needs at least one link.`);
    }
    group.links.forEach((link, linkIndex) => {
      if (link.label.trim() === "" || link.href.trim() === "") {
        found.push(
          `Link ${linkIndex + 1} in footer column ${groupIndex + 1} needs both a label and a link.`,
        );
      }
    });
  });

  return found;
}

const rowClass =
  "grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]";

export function NavigationEditor({ navigation }: { navigation: RuntimeNavigation }) {
  const router = useRouter();
  const initial = React.useMemo(() => toDrafts(navigation), [navigation]);

  const [primary, setPrimary] = React.useState<LinkDraft[]>(initial.primary);
  const [footer, setFooter] = React.useState<GroupDraft[]>(initial.footer);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const issues = problems(primary, footer);

  function updatePrimary(index: number, patch: Partial<LinkDraft>) {
    setPrimary((current) =>
      current.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  }

  function updateGroup(index: number, patch: Partial<GroupDraft>) {
    setFooter((current) =>
      current.map((group, i) => (i === index ? { ...group, ...patch } : group)),
    );
  }

  function updateGroupLink(groupIndex: number, linkIndex: number, patch: Partial<LinkDraft>) {
    setFooter((current) =>
      current.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              links: group.links.map((link, j) =>
                j === linkIndex ? { ...link, ...patch } : link,
              ),
            }
          : group,
      ),
    );
  }

  async function save() {
    setFormError(null);

    if (issues.length > 0) {
      setFormError(issues.join(" "));
      return;
    }

    setSaving(true);

    const result = await saveNavigationAction({
      primary: primary.map((link) => ({
        label: link.label.trim(),
        labels: translations(link.labelNl),
        href: link.href.trim(),
      })),
      footer: footer.map((group) => ({
        heading: group.heading.trim(),
        headings: translations(group.headingNl),
        links: group.links.map((link) => ({
          label: link.label.trim(),
          labels: translations(link.labelNl),
          href: link.href.trim(),
        })),
      })),
    });

    setSaving(false);

    if (!result.ok) {
      const details = flattenFieldErrors(result.error.errors);
      setFormError(details.length > 0 ? details.join(" ") : result.error.message);
      toast.error("Navigation was not saved.");
      return;
    }

    toast.success("Navigation saved. The storefront configuration cache has been refreshed.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {formError ? (
        <Alert tone="danger" live title="The navigation was not saved">
          {formError}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Header navigation</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-body-sm text-ink-muted">
            The Dutch label is optional: a link without one shows its English label on the Dutch
            site. Up to {MAX_PRIMARY} links, in this order. The first five sit in the bar and the rest
            move into a “More” menu. A link to <code>/shop</code> also opens the category menu.{" "}
            {HREF_HINT}
          </p>

          {primary.length === 0 ? (
            <p className="text-body-sm text-ink-subtle">
              No header links. The storefront header shows the brand, search and the cart only.
            </p>
          ) : (
            <ul className="space-y-2">
              {primary.map((link, index) => (
                <li key={index} className={rowClass}>
                  <Input
                    aria-label={`Header link ${index + 1} label (English)`}
                    placeholder="Label (English)"
                    maxLength={MAX_LABEL}
                    value={link.label}
                    onChange={(event) => updatePrimary(index, { label: event.target.value })}
                  />
                  <Input
                    aria-label={`Header link ${index + 1} label (Nederlands)`}
                    placeholder="Label (Nederlands)"
                    lang="nl"
                    maxLength={MAX_LABEL}
                    value={link.labelNl}
                    onChange={(event) => updatePrimary(index, { labelNl: event.target.value })}
                  />
                  <Input
                    aria-label={`Header link ${index + 1} destination`}
                    placeholder="/shop"
                    maxLength={MAX_HREF}
                    value={link.href}
                    onChange={(event) => updatePrimary(index, { href: event.target.value })}
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Move header link ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => setPrimary((current) => move(current, index, index - 1))}
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Move header link ${index + 1} down`}
                      disabled={index === primary.length - 1}
                      onClick={() => setPrimary((current) => move(current, index, index + 1))}
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-danger"
                      aria-label={`Remove header link ${index + 1}`}
                      onClick={() =>
                        setPrimary((current) => current.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={primary.length >= MAX_PRIMARY}
            onClick={() => setPrimary((current) => [...current, { label: "", labelNl: "", href: "" }])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add header link
          </Button>
          {primary.length >= MAX_PRIMARY ? (
            <p className="text-body-sm text-ink-subtle">
              That is the maximum of {MAX_PRIMARY} header links.
            </p>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Footer navigation</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <p className="text-body-sm text-ink-muted">
            Up to {MAX_GROUPS} columns of up to {MAX_GROUP_LINKS} links. Published pages that none
            of these columns link are listed automatically in a “Pages” column, so they do not need
            repeating here.
          </p>

          {footer.length === 0 ? (
            <p className="text-body-sm text-ink-subtle">
              No footer columns. The footer shows the brand, contact details and the automatic
              pages column only.
            </p>
          ) : null}

          {footer.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-3 rounded-lg border border-line p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <Input
                    aria-label={`Footer column ${groupIndex + 1} heading (English)`}
                    placeholder="Column heading (English)"
                    maxLength={MAX_LABEL}
                    value={group.heading}
                    onChange={(event) => updateGroup(groupIndex, { heading: event.target.value })}
                  />
                  <Input
                    aria-label={`Footer column ${groupIndex + 1} heading (Nederlands)`}
                    placeholder="Kolomkop (Nederlands)"
                    lang="nl"
                    maxLength={MAX_LABEL}
                    value={group.headingNl}
                    onChange={(event) => updateGroup(groupIndex, { headingNl: event.target.value })}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Move footer column ${groupIndex + 1} left`}
                    disabled={groupIndex === 0}
                    onClick={() => setFooter((current) => move(current, groupIndex, groupIndex - 1))}
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Move footer column ${groupIndex + 1} right`}
                    disabled={groupIndex === footer.length - 1}
                    onClick={() => setFooter((current) => move(current, groupIndex, groupIndex + 1))}
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-danger"
                    aria-label={`Remove footer column ${groupIndex + 1}`}
                    onClick={() =>
                      setFooter((current) => current.filter((_, i) => i !== groupIndex))
                    }
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <ul className="space-y-2">
                {group.links.map((link, linkIndex) => (
                  <li key={linkIndex} className={rowClass}>
                    <Input
                      aria-label={`Footer column ${groupIndex + 1} link ${linkIndex + 1} label (English)`}
                      placeholder="Label (English)"
                      maxLength={MAX_LABEL}
                      value={link.label}
                      onChange={(event) =>
                        updateGroupLink(groupIndex, linkIndex, { label: event.target.value })
                      }
                    />
                    <Input
                      aria-label={`Footer column ${groupIndex + 1} link ${linkIndex + 1} label (Nederlands)`}
                      placeholder="Label (Nederlands)"
                      lang="nl"
                      maxLength={MAX_LABEL}
                      value={link.labelNl}
                      onChange={(event) =>
                        updateGroupLink(groupIndex, linkIndex, { labelNl: event.target.value })
                      }
                    />
                    <Input
                      aria-label={`Footer column ${groupIndex + 1} link ${linkIndex + 1} destination`}
                      placeholder="/pages/about"
                      maxLength={MAX_HREF}
                      value={link.href}
                      onChange={(event) =>
                        updateGroupLink(groupIndex, linkIndex, { href: event.target.value })
                      }
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move link ${linkIndex + 1} up in footer column ${groupIndex + 1}`}
                        disabled={linkIndex === 0}
                        onClick={() =>
                          updateGroup(groupIndex, {
                            links: move(group.links, linkIndex, linkIndex - 1),
                          })
                        }
                      >
                        <ArrowUp className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move link ${linkIndex + 1} down in footer column ${groupIndex + 1}`}
                        disabled={linkIndex === group.links.length - 1}
                        onClick={() =>
                          updateGroup(groupIndex, {
                            links: move(group.links, linkIndex, linkIndex + 1),
                          })
                        }
                      >
                        <ArrowDown className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-danger"
                        aria-label={`Remove link ${linkIndex + 1} from footer column ${groupIndex + 1}`}
                        onClick={() =>
                          updateGroup(groupIndex, {
                            links: group.links.filter((_, j) => j !== linkIndex),
                          })
                        }
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={group.links.length >= MAX_GROUP_LINKS}
                onClick={() =>
                  updateGroup(groupIndex, {
                    links: [...group.links, { label: "", labelNl: "", href: "" }],
                  })
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Add link
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={footer.length >= MAX_GROUPS}
            onClick={() =>
              setFooter((current) => [...current, { heading: "", headingNl: "", links: [{ label: "", labelNl: "", href: "" }] }])
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add footer column
          </Button>
          {footer.length >= MAX_GROUPS ? (
            <p className="text-body-sm text-ink-subtle">
              That is the maximum of {MAX_GROUPS} footer columns.
            </p>
          ) : null}
        </CardBody>
      </Card>

      {issues.length > 0 ? (
        <Alert tone="warning" title="Finish these rows before saving">
          <ul className="list-disc space-y-0.5 pl-4">
            {issues.slice(0, 6).map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            setPrimary(initial.primary);
            setFooter(initial.footer);
            setFormError(null);
          }}
        >
          Reset
        </Button>
        <Button loading={saving} loadingLabel="Saving…" onClick={() => void save()}>
          Save navigation
        </Button>
      </div>
    </div>
  );
}
