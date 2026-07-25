const AdminPlaceholder = ({ title }: { title: string }) => {
  return (
    <div className="max-w-2xl uw-rise">
      <h1 className="text-[clamp(28px,5vw,42px)] font-bold tracking-tight uppercase leading-none uw-gradient-text">
        {title}
      </h1>
      <p className="mt-snug text-body-md text-[var(--uw-muted)]">
        Coming soon.
      </p>
    </div>
  );
};

export default AdminPlaceholder;
