import CronLauncher from '@/components/dashboard/CronLauncher';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CronLauncher floating />
    </>
  );
}
