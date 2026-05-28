import { useState } from "react";
import { useForm } from "react-hook-form";
import { UserCog, Plus, Power } from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/Dashboard";
import { Toolbar, FilterSelect } from "@/components/ui/Toolbar";
import { useResource, useMutation } from "@/hooks/useResource";
import { useConfirm } from "@/hooks/useConfirm";
import { userApi } from "@/api/resources.api";
import { qk } from "@/lib/queryKeys";
import { notify } from "@/store/ui.store";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { initials, fieldErrors, errorMessage } from "@/lib/utils";

/**
 * StaffPage (Clinic Admin) — manage the clinic's staff accounts:
 * doctors, receptionists, and additional admins.
 */
const STAFF_ROLES = [ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.CLINIC_ADMIN];

export default function StaffPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const confirm = useConfirm();

  const params = {
    page,
    limit: 10,
    search: search || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
  };
  const { data, meta, loading, error } = useResource(
    qk.staff.list(params),
    () => userApi.list(params),
  );

  const staff = data?.users || data?.items || (Array.isArray(data) ? data : []);

  const toggleActive = useMutation(
    (member) =>
      member.isActive
        ? userApi.deactivate(member.id)
        : userApi.update(member.id, { isActive: true }),
    {
      invalidate: [qk.staff.all, qk.doctors.all],
      onSuccess: () => notify.success("Staff member updated."),
      onError: (err) => notify.error(errorMessage(err)),
    },
  );

  const handleToggle = async (member) => {
    const ok = await confirm.ask({
      title: member.isActive
        ? "Deactivate staff member?"
        : "Reactivate staff member?",
      message: member.isActive
        ? `${member.firstName} ${member.lastName} will no longer be able to sign in.`
        : `${member.firstName} ${member.lastName} will regain access.`,
      confirmLabel: member.isActive ? "Deactivate" : "Reactivate",
      tone: member.isActive ? "danger" : "primary",
    });
    if (ok) toggleActive.mutate(member);
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine-100 text-xs font-semibold text-pine-700">
            {initials(u.firstName, u.lastName)}
          </span>
          <div>
            <p className="font-semibold text-pine-900">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-xs text-paper-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => <Badge tone="pine">{ROLE_LABELS[u.role] || u.role}</Badge>,
    },
    {
      key: "phone",
      header: "Phone",
      render: (u) => u.phone || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <Badge tone={u.isActive ? "green" : "red"}>
          {u.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (u) => (
        <Button
          size="sm"
          variant={u.isActive ? "ghost" : "outline"}
          onClick={() => handleToggle(u)}
        >
          <Power className="h-3.5 w-3.5" />
          {u.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        subtitle="Doctors, receptionists, and administrators at your clinic."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Add staff
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
            searchPlaceholder="Search by name or email…"
          >
            <FilterSelect
              value={roleFilter}
              onChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All roles" },
                ...STAFF_ROLES.map((r) => ({
                  value: r,
                  label: ROLE_LABELS[r],
                })),
              ]}
            />
          </Toolbar>
        </div>
        <DataTable
          columns={columns}
          rows={staff}
          loading={loading}
          error={error}
          emptyTitle="No staff yet"
          emptyMessage="Add your first doctor or receptionist to get started."
          emptyAction={
            <Button onClick={() => setCreating(true)} className="mt-2">
              <Plus className="h-4 w-4" />
              Add staff
            </Button>
          }
        />
        <Pagination meta={meta} page={page} onPageChange={setPage} />
      </Card>

      {creating && (
        <StaffFormModal
          onClose={() => setCreating(false)}
          onSaved={() => setCreating(false)}
        />
      )}

      <ConfirmDialog {...confirm.props} />
    </div>
  );
}

/**
 * StaffFormModal — create a new staff account. Staff are created
 * directly by the clinic admin (no self-registration).
 */
function StaffFormModal({ onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    watch, // ← ADD
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: { role: ROLES.RECEPTIONIST },
  });

  const selectedRole = watch("role"); // ← ADD — role change track karo

  const { mutateAsync, loading } = useMutation((body) => userApi.create(body), {
    invalidate: [qk.staff.all, qk.doctors.all],
    onSuccess: () => {
      notify.success("Staff member added.");
      onSaved();
    },
  });

  const onSubmit = async (values) => {
    try {
      const body = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || undefined,
        role: values.role,
        password: values.password,
      };

      // ✅ DOCTOR select hai toh doctorProfile add karo
      if (values.role === ROLES.DOCTOR) {
        body.doctorProfile = {
          specialization: values.specialization,
          consultationFee: Number(values.consultationFee),
          qualification: values.qualification || undefined,
          experienceYears: values.experienceYears
            ? Number(values.experienceYears)
            : undefined,
          bio: values.bio || undefined,
        };
      }

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
      title="Add staff member"
      description="Create an account for a doctor, receptionist, or admin."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            Add staff member
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            required
            error={errors.firstName?.message}
            {...register("firstName", { required: "Required" })}
          />
          <Input
            label="Last name"
            required
            error={errors.lastName?.message}
            {...register("lastName", { required: "Required" })}
          />
        </div>
        <Input
          label="Email"
          type="email"
          required
          error={errors.email?.message}
          {...register("email", { required: "Email is required" })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            placeholder="+91 98765 43210"
            {...register("phone")}
          />
          <Select
            label="Role"
            required
            {...register("role", { required: true })}
          >
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="Temporary password"
          type="text"
          required
          hint="Share with the staff member; they should change it on first sign-in."
          error={errors.password?.message}
          {...register("password", {
            required: "A password is required",
            minLength: { value: 8, message: "At least 8 characters" },
          })}
        />

        {/* ✅ DOCTOR fields — sirf tab dikhenge jab role = DOCTOR ho */}
        {selectedRole === ROLES.DOCTOR && (
          <div className="space-y-3 rounded-xl border border-pine-200 bg-pine-50 p-4">
            <p className="text-sm font-semibold text-pine-900">
              Doctor Profile
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Specialization"
                required
                placeholder="General Physician"
                error={errors.specialization?.message}
                {...register("specialization", {
                  required: "Specialization is required",
                })}
              />
              <Input
                label="Consultation Fee (₹)"
                type="number"
                required
                placeholder="500"
                error={errors.consultationFee?.message}
                {...register("consultationFee", {
                  required: "Fee is required",
                  min: { value: 0, message: "Must be 0 or more" },
                })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Qualification"
                placeholder="MBBS, MD"
                {...register("qualification")}
              />
              <Input
                label="Experience (years)"
                type="number"
                placeholder="5"
                {...register("experienceYears")}
              />
            </div>
            <Input
              label="Bio"
              placeholder="Brief description..."
              {...register("bio")}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
