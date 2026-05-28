import { useState } from "react";
import { useForm } from "react-hook-form";
import { Building2, Plus, Trash2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { PageLoader, EmptyState } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/Dashboard";
import { useResource, useMutation } from "@/hooks/useResource";
import { useConfirm } from "@/hooks/useConfirm";
import { departmentApi } from "@/api/resources.api";
import { qk } from "@/lib/queryKeys";
import { notify } from "@/store/ui.store";
import { errorMessage } from "@/lib/utils";

/**
 * DepartmentsPage (Clinic Admin) — manage the clinic's departments.
 */
export default function DepartmentsPage() {
  const [creating, setCreating] = useState(false);
  const confirm = useConfirm();

  const { data, loading, error } = useResource(qk.departments.list(), () =>
    departmentApi.list(),
  );

  const departments = data?.departments || (Array.isArray(data) ? data : []);

  const remove = useMutation((id) => departmentApi.remove(id), {
    invalidate: [qk.departments.all],
    onSuccess: () => notify.success("Department removed."),
    onError: (err) => notify.error(errorMessage(err)),
  });

  const handleRemove = async (dept) => {
    const ok = await confirm.ask({
      title: "Remove department?",
      message: `"${dept.name}" will be removed. Doctors assigned to it will need reassigning.`,
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (ok) remove.mutate(dept.id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        subtitle="Organise your clinic into departments or specialities."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            New department
          </Button>
        }
      />

      {loading ? (
        <PageLoader label="Loading departments…" />
      ) : error ? (
        <Card>
          <EmptyState title="Couldn't load departments" message={error} />
        </Card>
      ) : departments.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No departments yet"
            message="Add departments like Cardiology or Pediatrics to organise your doctors."
            action={
              <Button onClick={() => setCreating(true)} className="mt-2">
                <Plus className="h-4 w-4" />
                New department
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-pine-100 p-2.5 text-pine-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-pine-900">{dept.name}</p>
                      <p className="text-xs text-paper-500">
                        {dept.doctorCount != null
                          ? `${dept.doctorCount} doctor(s)`
                          : "Department"}
                      </p>
                      {dept.description && (
                        <p className="mt-0.5 text-xs text-paper-400">
                          {dept.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(dept)}
                    className="rounded-lg p-1.5 text-paper-400 transition-colors hover:bg-clay-50 hover:text-clay-600"
                    aria-label="Remove department"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <DepartmentFormModal
          onClose={() => setCreating(false)}
          onSaved={() => setCreating(false)}
        />
      )}

      <ConfirmDialog {...confirm.props} />
    </div>
  );
}

function DepartmentFormModal({ onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { mutate, loading } = useMutation(
    // ✅ sirf name nahi, poora object bhejo
    (body) => departmentApi.create(body),
    {
      invalidate: [qk.departments.all],
      onSuccess: () => {
        notify.success("Department created.");
        onSaved();
      },
      onError: (err) => notify.error(errorMessage(err)),
    },
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="New department"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit((v) =>
              // ✅ name + description dono bhejo
              mutate({ name: v.name, description: v.description || undefined }),
            )}
            loading={loading}
          >
            Create
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit((v) =>
          mutate({ name: v.name, description: v.description || undefined }),
        )}
        className="space-y-3"
      >
        <Input
          label="Department name"
          required
          placeholder="e.g. Cardiology"
          error={errors.name?.message}
          {...register("name", { required: "Department name is required" })}
        />
        {/* ✅ description field add kiya */}
        <Input
          label="Description"
          placeholder="e.g. Eye care, vision testing, and eye surgeries"
          error={errors.description?.message}
          {...register("description")}
        />
      </form>
    </Modal>
  );
}
