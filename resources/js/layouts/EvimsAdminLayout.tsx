import { Link, usePage } from '@inertiajs/react';

const NAV_ITEMS = [
    { label: 'Dashboard', route: 'admin.dashboard' },
    { label: 'Enrollment Applications', route: 'admin.enrollments.index' },
    { label: 'Tuition Fees', route: 'admin.gradeLevels.index' },
];

export default function EvimsAdminLayout({ children }) {
    const { url, props } = usePage();
    const user = props.auth?.user;

    const isActive = (routeName) => {
        try {
            return url.startsWith(new URL(route(routeName)).pathname);
        } catch {
            return false;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-6 py-5">
                    <p className="text-lg font-bold text-gray-900">EVIMS</p>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.route}
                            href={route(item.route)}
                            className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                                isActive(item.route)
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="border-t border-gray-100 px-3 py-4">
                    {user && (
                        <div className="mb-3 px-3">
                            <p className="truncate text-sm font-medium text-gray-800">{user.name}</p>
                            <p className="truncate text-xs text-gray-500">{user.email}</p>
                        </div>
                    )}
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                        Log Out
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}
