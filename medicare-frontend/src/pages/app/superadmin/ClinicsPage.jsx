import { useState } from "react";
import { useForm } from "react-hook-form";
import { Building2, Plus, Power, Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/Dashboard";
import { Toolbar } from "@/components/ui/Toolbar";
import { useResource, useMutation } from "@/hooks/useResource";
import { useConfirm } from "@/hooks/useConfirm";
import { clinicApi } from "@/api/resources.api";
import { qk } from "@/lib/queryKeys";
import { notify } from "@/store/ui.store";
import { formatDate, fieldErrors, errorMessage } from "@/lib/utils";

/**
 * ClinicsPage (Super Admin) — list, create, edit, and deactivate the
 * clinic tenants on the platform.
 */
export default function ClinicsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null | {} (new) | clinic
  const confirm = useConfirm();

  const params = { page, limit: 10, search: search || undefined };
  const { data, meta, loading, error } = useResource(
    qk.clinics.list(params),
    () => clinicApi.list(params),
  );

  const clinics =
    data?.clinics || data?.items || (Array.isArray(data) ? data : []);

  const toggleActive = useMutation(
    (clinic) =>
      clinic.isActive
        ? clinicApi.deactivate(clinic.id)
        : clinicApi.update(clinic.id, { isActive: true }),
    {
      invalidate: [qk.clinics.all],
      onSuccess: () => notify.success("Clinic updated."),
      onError: (err) => notify.error(errorMessage(err)),
    },
  );

  const handleToggle = async (clinic) => {
    const ok = await confirm.ask({
      title: clinic.isActive ? "Deactivate clinic?" : "Reactivate clinic?",
      message: clinic.isActive
        ? `${clinic.name} will lose access until reactivated. Staff won't be able to sign in.`
        : `${clinic.name} will regain access to the platform.`,
      confirmLabel: clinic.isActive ? "Deactivate" : "Reactivate",
      tone: clinic.isActive ? "danger" : "primary",
    });
    if (ok) toggleActive.mutate(clinic);
  };

  const columns = [
    {
      key: "name",
      header: "Clinic",
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine-100 text-pine-700">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-pine-900">{c.name}</p>
            <p className="text-xs text-paper-500">
              {c.email || c.contactEmail || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (c) => c.phone || c.contactPhone || "—",
    },
    {
      key: "created",
      header: "Joined",
      render: (c) => formatDate(c.createdAt),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <Badge tone={c.isActive ? "green" : "red"}>
          {c.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant={c.isActive ? "ghost" : "outline"}
            onClick={() => handleToggle(c)}
          >
            <Power className="h-3.5 w-3.5" />
            {c.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinics"
        subtitle="Every clinic tenant on the platform."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" />
            New clinic
          </Button>
        }
      />

      <Card>
        <div className="p-4">
          <Toolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Search clinics by name…"
          />
        </div>
        <DataTable
          columns={columns}
          rows={clinics}
          loading={loading}
          error={error}
          emptyTitle="No clinics yet"
          emptyMessage="Create the first clinic tenant to get started."
          emptyAction={
            <Button onClick={() => setEditing({})} className="mt-2">
              <Plus className="h-4 w-4" />
              New clinic
            </Button>
          }
        />
        <Pagination meta={meta} page={page} onPageChange={setPage} />
      </Card>

      {editing && (
        <ClinicFormModal
          clinic={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      <ConfirmDialog {...confirm.props} />
    </div>
  );
}

/**
 * ClinicFormModal — create or edit a clinic.
 */
function ClinicFormModal({ clinic, onClose, onSaved }) {
  const isEdit = !!clinic;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: clinic?.name || "",
      email: clinic?.email || clinic?.contactEmail || "",
      phone: clinic?.phone || clinic?.contactPhone || "",
      address: clinic?.address || "",
      adminEmail: "",
      adminFirstName: "",
      adminLastName: "",
      adminPassword: "",
    },
  });

  const { mutateAsync, loading } = useMutation(
    (body) =>
      isEdit ? clinicApi.update(clinic.id, body) : clinicApi.create(body),
    {
      invalidate: [qk.clinics.all],
      onSuccess: () => {
        notify.success(isEdit ? "Clinic updated." : "Clinic created.");
        onSaved();
      },
    },
  );

  const onSubmit = async (values) => {
    // For a new clinic, include the initial admin account fields;
    // for an edit, send only the clinic fields.
    // const body = isEdit
    //   ? {
    //       name: values.name,
    //       email: values.email,
    //       phone: values.phone || undefined,
    //       address: values.address || undefined,
    //     }
    //   : {
    //       name: values.name,
    //       email: values.email,
    //       phone: values.phone || undefined,
    //       address: values.address || undefined,
    //       admin: {
    //         email: values.adminEmail,
    //         firstName: values.adminFirstName,
    //         lastName: values.adminLastName,
    //         password: values.adminPassword,
    //       },
    //     };

    // ✅ BAAD MEIN — nested admin object hatao, flat karo
    const body = isEdit
      ? {
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          address: values.address || undefined,
        }
      : {
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          address: values.address || undefined,
          adminEmail: values.adminEmail,
          adminFirstName: values.adminFirstName,
          adminLastName: values.adminLastName,
          adminPassword: values.adminPassword,
        };
    try {
      await mutateAsync(body);
    } catch (err) {
      const fields = fieldErrors(err);
      if (fields) {
        Object.entries(fields).forEach(([n, m]) => setError(n, { message: m }));
      } else {
        notify.error(errorMessage(err));
      }
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit clinic" : "New clinic"}
      description={
        isEdit
          ? "Update this clinic’s details."
          : "Create a clinic tenant and its first administrator."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            {isEdit ? "Save changes" : "Create clinic"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Clinic name"
          required
          placeholder="Sunrise Family Clinic"
          error={errors.name?.message}
          {...register("name", { required: "Clinic name is required" })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Contact email"
            type="email"
            required
            placeholder="clinic@example.com"
            error={errors.email?.message}
            {...register("email", {
              required: "Contact email is required",
            })}
          />
          <Input
            label="Phone"
            placeholder="+91 731 000 0000"
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>
        <Input
          label="Address"
          placeholder="Street, city, state"
          error={errors.address?.message}
          {...register("address")}
        />

        {!isEdit && (
          <div className="rounded-xl border border-paper-200 bg-paper-100 p-4">
            <p className="text-sm font-semibold text-pine-900">
              Clinic administrator
            </p>
            <p className="mb-3 mt-0.5 text-xs text-paper-500">
              The first admin account for this clinic. They can invite the rest
              of the team.
            </p>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="First name"
                  required
                  error={errors.adminFirstName?.message}
                  {...register("adminFirstName", {
                    required: "Required",
                  })}
                />
                <Input
                  label="Last name"
                  required
                  error={errors.adminLastName?.message}
                  {...register("adminLastName", {
                    required: "Required",
                  })}
                />
              </div>
              <Input
                label="Admin email"
                type="email"
                required
                error={errors.adminEmail?.message}
                {...register("adminEmail", {
                  required: "Admin email is required",
                })}
              />
              <Input
                label="Temporary password"
                type="text"
                required
                hint="Share this with the admin; they should change it on first sign-in."
                error={errors.adminPassword?.message}
                {...register("adminPassword", {
                  required: "A password is required",
                  minLength: {
                    value: 8,
                    message: "At least 8 characters",
                  },
                })}
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
