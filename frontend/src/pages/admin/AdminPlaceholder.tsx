const AdminPlaceholder = ({ title }: { title: string }) => {
  return (
    <div className="max-w-2xl">
      <h1 className="font-headline-md text-headline-md text-on-surface">
        {title}
      </h1>
      <p className="mt-tight text-body-md text-on-surface-variant">
        Coming soon.
      </p>
    </div>
  );
};

export default AdminPlaceholder;
