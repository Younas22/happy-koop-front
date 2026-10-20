"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  deleteAddressAction,
  saveAddressAction,
  setDefaultAddressAction,
} from "@/app/account/actions";
import { AddressFields } from "@/components/address/AddressFields";
import { AddressBlock } from "@/components/orders/OrderParts";
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
import { EmptyState } from "@/components/ui/EmptyState";
import type { CountryOption } from "@/lib/geo/countries";
import { applyFieldErrors } from "@/lib/forms/api-errors";
import type { SavedAddress } from "@/lib/types/api";
import { addressSchema, emptyAddress, toAddressPayload } from "@/lib/validation/address";

const formSchema = addressSchema.extend({
  isDefaultShipping: z.boolean(),
  isDefaultBilling: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const FIELDS = [
  "firstName",
  "lastName",
  "company",
  "line1",
  "line2",
  "city",
  "region",
  "postalCode",
  "countryCode",
  "phone",
  "isDefaultShipping",
  "isDefaultBilling",
] as const;

function toFormValues(address: SavedAddress | null, fallbackCountry: string): FormValues {
  if (!address) {
    return { ...emptyAddress(fallbackCountry), isDefaultShipping: false, isDefaultBilling: false };
  }
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    region: address.region ?? "",
    postalCode: address.postalCode,
    countryCode: address.countryCode,
    phone: address.phone ?? "",
    isDefaultShipping: address.isDefaultShipping,
    isDefaultBilling: address.isDefaultBilling,
  };
}

/**
 * Address book.
 *
 * Create, edit, set-default and delete, each through a Server Action that
 * re-checks the session and revalidates the account pages. Deleting asks for
 * confirmation in an accessible Dialog that names the address being removed -
 * no destructive action happens on a single click.
 */
export function AddressManager({
  addresses,
  countries,
  defaultCountry,
}: {
  addresses: readonly SavedAddress[];
  countries: readonly CountryOption[];
  defaultCountry: string;
}) {
  const router = useRouter();

  const [editing, setEditing] = React.useState<{ open: boolean; address: SavedAddress | null }>({
    open: false,
    address: null,
  });
  const [deleting, setDeleting] = React.useState<SavedAddress | null>(null);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(null, defaultCountry),
  });

  function openForm(address: SavedAddress | null) {
    setFormError(null);
    form.reset(toFormValues(address, defaultCountry));
    setEditing({ open: true, address });
  }

  async function onSubmit(values: FormValues) {
    setFormError(null);

    const result = await saveAddressAction(editing.address?.id ?? null, {
      ...toAddressPayload(values),
      isDefaultShipping: values.isDefaultShipping,
      isDefaultBilling: values.isDefaultBilling,
    });

    if (!result.ok) {
      setFormError(applyFieldErrors(result.error, form.setError, FIELDS));
      return;
    }

    setEditing({ open: false, address: null });
    toast.success(editing.address ? "Address updated." : "Address added.");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);

    const result = await deleteAddressAction(deleting.id);
    setBusyId(null);

    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }

    setDeleting(null);
    toast.success("Address removed.");
    router.refresh();
  }

  async function makeDefault(address: SavedAddress, type: "shipping" | "billing") {
    setBusyId(address.id);
    const result = await setDefaultAddressAction(address.id, type);
    setBusyId(null);

    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }

    toast.success(`Default ${type} address updated.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openForm(null)}>
          <Plus className="size-4" aria-hidden="true" />
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Save an address and it will be offered at checkout."
          action={<Button onClick={() => openForm(null)}>Add an address</Button>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="surface-card flex flex-col p-4">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {address.isDefaultShipping ? <Badge tone="brand">Default shipping</Badge> : null}
                {address.isDefaultBilling ? <Badge tone="info">Default billing</Badge> : null}
              </div>

              <AddressBlock address={address} />

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => openForm(address)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>

                {!address.isDefaultShipping ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === address.id}
                    onClick={() => void makeDefault(address, "shipping")}
                  >
                    <Star className="size-4" aria-hidden="true" />
                    Default shipping
                  </Button>
                ) : null}

                {!address.isDefaultBilling ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === address.id}
                    onClick={() => void makeDefault(address, "billing")}
                  >
                    <Star className="size-4" aria-hidden="true" />
                    Default billing
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:bg-danger-tint"
                  onClick={() => setDeleting(address)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create / edit */}
      <Dialog
        open={editing.open}
        onOpenChange={(open) => setEditing((state) => ({ ...state, open }))}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing.address ? "Edit address" : "Add address"}</DialogTitle>
            <DialogDescription>
              Used for delivery and billing. Shipping options are checked against the country you
              choose.
            </DialogDescription>
          </DialogHeader>

          <FormProvider {...form}>
            <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
              <DialogBody className="space-y-4">
                {formError ? (
                  <Alert tone="danger" live title="We could not save this address">
                    {formError}
                  </Alert>
                ) : null}

                <AddressFields idPrefix="address" countries={countries} />

                <div className="space-y-1">
                  <CheckboxField
                    id="address-default-shipping"
                    label="Use as my default shipping address"
                    checked={form.watch("isDefaultShipping") === true}
                    onCheckedChange={(checked) =>
                      form.setValue("isDefaultShipping", checked === true)
                    }
                  />
                  <CheckboxField
                    id="address-default-billing"
                    label="Use as my default billing address"
                    checked={form.watch("isDefaultBilling") === true}
                    onCheckedChange={(checked) =>
                      form.setValue("isDefaultBilling", checked === true)
                    }
                  />
                </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditing({ open: false, address: null })}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={form.formState.isSubmitting}
                  loadingLabel="Saving…"
                >
                  {editing.address ? "Save address" : "Add address"}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation, naming the record */}
      <Dialog open={deleting !== null} onOpenChange={(open) => (open ? null : setDeleting(null))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this address?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `${deleting.firstName} ${deleting.lastName}, ${deleting.line1}, ${deleting.city} ${deleting.postalCode} will be removed from your address book. Orders already placed keep their own copy.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Keep address
            </Button>
            <Button
              variant="danger"
              loading={busyId !== null && busyId === deleting?.id}
              loadingLabel="Deleting…"
              onClick={() => void confirmDelete()}
            >
              Delete address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
