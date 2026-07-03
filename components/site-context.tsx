"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Lang = "cs" | "en";
export type ModalId = "login" | "register" | "inquiry" | "dashboard" | null;

export interface Order {
  orderId?: string;
  product: string;
  price: string;
  paymentMethod: "card" | "bank";
  date: string;
  status: string;
}

interface InquiryProduct {
  name: string;
  price: string;
}

interface SiteState {
  lang: Lang;
  toggleLang: () => void;

  isLoggedIn: boolean;
  userName: string;
  userEmail: string;

  activeModal: ModalId;
  openModal: (id: Exclude<ModalId, null>) => void;
  closeModals: () => void;

  inquiry: InquiryProduct | null;
  openInquiry: (name: string, price: string) => void;

  orders: Order[];
  addOrder: (order: Order) => void;

  login: (email: string, password: string) => string | null;
  register: (name: string, email: string) => void;
  logout: () => void;

  onPricingClick: (productName: string, price: string) => void;

  toast: string | null;
  showToast: (msg: string, duration?: number) => void;
}

const SiteContext = createContext<SiteState | null>(null);

const LS = {
  lang: "yk_lang",
  loggedIn: "yk_logged_in",
  name: "yk_user_name",
  email: "yk_user_email",
  orders: "yk_orders",
} as const;

export function SiteProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("cs");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const [inquiry, setInquiry] = useState<InquiryProduct | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate persisted state on mount (client only — avoids SSR mismatch).
  useEffect(() => {
    const savedLang = localStorage.getItem(LS.lang);
    if (savedLang === "cs" || savedLang === "en") setLang(savedLang);
    setIsLoggedIn(localStorage.getItem(LS.loggedIn) === "1");
    setUserName(localStorage.getItem(LS.name) || "");
    setUserEmail(localStorage.getItem(LS.email) || "");
    try {
      setOrders(JSON.parse(localStorage.getItem(LS.orders) || "[]"));
    } catch {
      setOrders([]);
    }
  }, []);

  // Reflect lang on <html lang>.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Lock body scroll while a modal is open.
  useEffect(() => {
    document.body.style.overflow = activeModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeModal]);

  // Close any modal on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "cs" ? "en" : "cs";
      localStorage.setItem(LS.lang, next);
      return next;
    });
  }, []);

  const openModal = useCallback((id: Exclude<ModalId, null>) => {
    setActiveModal(id);
  }, []);
  const closeModals = useCallback(() => setActiveModal(null), []);

  const showToast = useCallback((msg: string, duration = 3000) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), duration);
  }, []);

  const login = useCallback(
    (email: string, password: string): string | null => {
      const emailVal = email.trim().toLowerCase();
      const allowed =
        emailVal === "seyri@creatidea.cz" ||
        (emailVal === "test@test.cz" && password === "Testovaci062026");
      if (!allowed) {
        return lang === "cs"
          ? "Nesprávný e-mail nebo heslo."
          : "Incorrect e-mail or password.";
      }
      setIsLoggedIn(true);
      setUserEmail(email.trim());
      localStorage.setItem(LS.loggedIn, "1");
      localStorage.setItem(LS.email, email.trim());
      setActiveModal(null);
      showToast(
        lang === "cs" ? "Přihlášení proběhlo úspěšně." : "Logged in successfully."
      );
      return null;
    },
    [lang, showToast]
  );

  const register = useCallback(
    (name: string, email: string) => {
      setIsLoggedIn(true);
      setUserName(name.trim());
      setUserEmail(email.trim());
      localStorage.setItem(LS.loggedIn, "1");
      localStorage.setItem(LS.name, name.trim());
      localStorage.setItem(LS.email, email.trim());
      setActiveModal(null);
      showToast(lang === "cs" ? "Účet byl vytvořen. Vítejte!" : "Account created. Welcome!");
    },
    [lang, showToast]
  );

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem(LS.loggedIn);
    setActiveModal(null);
    showToast(lang === "cs" ? "Byli jste odhlášeni." : "You have been logged out.");
  }, [lang, showToast]);

  const openInquiry = useCallback((name: string, price: string) => {
    setInquiry({ name, price });
    setActiveModal("inquiry");
  }, []);

  const onPricingClick = useCallback(
    (productName: string, price: string) => {
      openInquiry(productName, price);
    },
    [openInquiry]
  );

  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => {
      const next = [order, ...prev];
      localStorage.setItem(LS.orders, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<SiteState>(
    () => ({
      lang,
      toggleLang,
      isLoggedIn,
      userName,
      userEmail,
      activeModal,
      openModal,
      closeModals,
      inquiry,
      openInquiry,
      orders,
      addOrder,
      login,
      register,
      logout,
      onPricingClick,
      toast,
      showToast,
    }),
    [
      lang,
      toggleLang,
      isLoggedIn,
      userName,
      userEmail,
      activeModal,
      openModal,
      closeModals,
      inquiry,
      openInquiry,
      orders,
      addOrder,
      login,
      register,
      logout,
      onPricingClick,
      toast,
      showToast,
    ]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteState {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used within SiteProvider");
  return ctx;
}
