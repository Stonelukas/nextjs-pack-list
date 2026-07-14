const sharedElements = {
  rootBox: {
    width: "100%",
  },
  cardBox: {
    width: "100%",
    boxShadow: "none",
  },
  card: {
    width: "100%",
    backgroundColor: "var(--card)",
    color: "var(--card-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    boxShadow: "none",
  },
  header: {
    paddingBottom: "0.25rem",
  },
  headerTitle: {
    color: "var(--foreground)",
    fontFamily: "var(--font-sans)",
    fontSize: "1.75rem",
    fontWeight: "650",
    letterSpacing: "-0.03em",
    lineHeight: "1.15",
  },
  headerSubtitle: {
    color: "var(--muted-foreground)",
    fontFamily: "var(--font-sans)",
    fontSize: "0.9375rem",
    lineHeight: "1.5",
  },
  socialButtonsBlockButton: {
    minHeight: "2.75rem",
    backgroundColor: "var(--surface-muted)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    boxShadow: "none",
    fontFamily: "var(--font-sans)",
  },
  socialButtonsBlockButtonText: {
    color: "var(--foreground)",
    fontWeight: "600",
  },
  formFieldLabel: {
    color: "var(--foreground)",
    fontFamily: "var(--font-sans)",
    fontSize: "0.875rem",
    fontWeight: "600",
  },
  formFieldInput: {
    minHeight: "2.75rem",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    border: "1px solid var(--input)",
    borderRadius: "var(--radius)",
    boxShadow: "none",
    fontFamily: "var(--font-sans)",
  },
  formFieldInputShowPasswordButton: {
    color: "var(--muted-foreground)",
  },
  formButtonPrimary: {
    minHeight: "2.75rem",
    backgroundColor: "var(--primary)",
    color: "var(--primary-foreground)",
    borderRadius: "var(--radius)",
    boxShadow: "none",
    fontFamily: "var(--font-sans)",
    fontWeight: "650",
  },
  dividerLine: {
    backgroundColor: "var(--border)",
  },
  dividerText: {
    color: "var(--muted-foreground)",
  },
  footer: {
    backgroundColor: "var(--surface-muted)",
    borderTop: "1px solid var(--border)",
  },
  footerActionText: {
    color: "var(--muted-foreground)",
  },
  footerActionLink: {
    color: "var(--primary)",
    fontWeight: "600",
  },
  formFieldErrorText: {
    color: "var(--destructive)",
  },
} as const;

export const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorBackground: "var(--card)",
    colorPrimary: "var(--primary)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorDanger: "var(--destructive)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    fontFamily: '"Geist Variable", "Geist", system-ui, sans-serif',
    borderRadius: "var(--radius)",
  },
  elements: sharedElements,
  userProfile: {
    elements: {
      ...sharedElements,
      rootBox: {
        width: "100%",
      },
      cardBox: {
        width: "100%",
        maxWidth: "none",
        boxShadow: "none",
      },
      card: {
        width: "100%",
        maxWidth: "none",
        minHeight: "32rem",
        backgroundColor: "var(--card)",
        color: "var(--card-foreground)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: "none",
      },
      navbar: {
        backgroundColor: "var(--surface-muted)",
        borderRight: "1px solid var(--border)",
      },
      navbarButton: {
        color: "var(--muted-foreground)",
        borderRadius: "var(--radius)",
      },
      navbarButton__active: {
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      },
      navbarButtonText: {
        color: "inherit",
        fontFamily: "var(--font-sans)",
        fontWeight: "600",
      },
      pageScrollBox: {
        backgroundColor: "var(--card)",
      },
    },
  },
  userButton: {
    layout: {
      unsafe_disableDevelopmentModeWarnings: true,
    },
    elements: {
      userButtonTrigger: {
        borderRadius: "var(--radius)",
        boxShadow: "none",
      },
      userButtonAvatarBox: {
        width: "2.25rem",
        height: "2.25rem",
        border: "1px solid var(--border)",
      },
      userButtonPopoverCard: {
        backgroundColor: "var(--card)",
        color: "var(--card-foreground)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-dialog)",
        overflow: "hidden",
      },
      userButtonPopoverMain: {
        backgroundColor: "var(--card)",
      },
      userPreview: {
        padding: "1rem",
      },
      userPreviewMainIdentifier: {
        color: "var(--foreground)",
        fontFamily: "var(--font-sans)",
        fontWeight: "650",
      },
      userPreviewMainIdentifierText: {
        color: "var(--foreground)",
      },
      userPreviewSecondaryIdentifier: {
        color: "var(--muted-foreground)",
        fontFamily: "var(--font-sans)",
      },
      userButtonPopoverActions: {
        padding: "0.5rem",
        backgroundColor: "var(--card)",
      },
      userButtonPopoverActionButton: {
        minHeight: "2.75rem",
        padding: "0.625rem 0.75rem",
        backgroundColor: "var(--card)",
        color: "var(--foreground)",
        borderRadius: "calc(var(--radius) - 2px)",
        fontFamily: "var(--font-sans)",
        fontSize: "0.875rem",
        fontWeight: "600",
      },
      userButtonPopoverActionButtonIconBox: {
        color: "var(--primary)",
      },
      userButtonPopoverActionButtonIcon: {
        color: "var(--primary)",
      },
      userButtonPopoverFooter: {
        display: "none",
      },
    },
  },
} as const;

export const clerkLocalization = {
  signIn: {
    start: {
      title: "Sign in to Route Ledger",
      titleCombined: "Continue to Route Ledger",
      subtitle: "Welcome back. Sign in to continue.",
      subtitleCombined: "Choose a sign-in method to continue.",
    },
  },
  signUp: {
    start: {
      title: "Create your Route Ledger account",
      titleCombined: "Get started with Route Ledger",
      subtitle: "Build dependable packing lists for every route.",
      subtitleCombined: "Choose a sign-up method to continue.",
    },
  },
} as const;
