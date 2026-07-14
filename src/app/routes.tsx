/* eslint-disable react-refresh/only-export-components */
import { Outlet, type RouteObject } from "react-router-dom";

import { RouteErrorBoundary } from "@/app/errors/route-error-boundary";
import { RequireAdmin } from "@/app/guards/require-admin";
import { RequireAuth } from "@/app/guards/require-auth";
import { RequireConfiguredRuntime } from "@/app/guards/require-configured-runtime";
import { AuthLayout } from "@/app/layouts/auth-layout";
import { RootLayout } from "@/app/layouts/root-layout";
import { RouteLoading } from "@/app/loading/route-loading";
import { NotFoundPage } from "@/app/routes/not-found-page";

function ProtectedRoutes() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}

function AdminRoutes() {
  return (
    <RequireAdmin>
      <Outlet />
    </RequireAdmin>
  );
}

function ConfiguredRuntimeRoutes() {
  return (
    <RequireConfiguredRuntime>
      <Outlet />
    </RequireConfiguredRuntime>
  );
}

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    HydrateFallback: RouteLoading,
    children: [
      {
        index: true,
        lazy: async () => {
          const route = await import("@/features/home/home-page");
          return { Component: route.HomePage };
        },
      },
      {
        element: <AuthLayout />,
        children: [
          {
            path: "sign-in/*",
            lazy: async () => {
              const route = await import("@/features/auth/sign-in-page");
              return { Component: route.SignInPage };
            },
          },
          {
            path: "sign-up/*",
            lazy: async () => {
              const route = await import("@/features/auth/sign-up-page");
              return { Component: route.SignUpPage };
            },
          },
        ],
      },
      {
        element: <ConfiguredRuntimeRoutes />,
        children: [
          {
            path: "templates",
            lazy: async () => {
              const route = await import("@/features/templates/templates-page");
              return { Component: route.TemplatesPage };
            },
          },
        ],
      },
      {
        element: <ProtectedRoutes />,
        children: [
          {
            path: "lists",
            lazy: async () => {
              const route = await import("@/features/lists/list-index-page");
              return { Component: route.ListIndexPage };
            },
          },
          {
            path: "lists/new",
            lazy: async () => {
              const route = await import("@/features/lists/create-list-page");
              return { Component: route.CreateListPage };
            },
          },
          {
            path: "lists/:id",
            lazy: async () => {
              const route = await import("@/features/lists/list-detail-page");
              return { Component: route.ListDetailPage };
            },
          },
          {
            path: "lists/:id/edit",
            lazy: async () => {
              const route = await import("@/features/lists/edit-list-page");
              return { Component: route.EditListPage };
            },
          },
          {
            path: "categories",
            lazy: async () => {
              const route = await import("@/features/lists/categories-page");
              return { Component: route.CategoriesPage };
            },
          },
          {
            path: "tags",
            lazy: async () => {
              const route = await import("@/features/lists/tags-page");
              return { Component: route.TagsPage };
            },
          },
          {
            path: "settings",
            lazy: async () => {
              const route = await import("@/features/settings/settings-page");
              return { Component: route.SettingsPage };
            },
          },
          {
            path: "admin",
            element: <AdminRoutes />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const route = await import("@/features/admin/admin-page");
                  return { Component: route.AdminPage };
                },
              },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
