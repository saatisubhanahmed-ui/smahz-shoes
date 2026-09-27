import AiAssistant from "@/components/store/AiAssistant";
import AnnouncementBar from "@/components/store/AnnouncementBar";
import CartDrawer from "@/components/store/CartDrawer";
import { CartProvider } from "@/components/store/CartProvider";
import Footer from "@/components/store/Footer";
import Header from "@/components/store/Header";
import QuickView from "@/components/store/QuickView";
import Toast from "@/components/store/Toast";
import WhatsAppFloat from "@/components/store/WhatsAppFloat";

export default function StoreLayout({ children }) {
  return (
    <CartProvider>
      <AnnouncementBar />
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
      <AiAssistant />
      <CartDrawer />
      <QuickView />
      <Toast />
    </CartProvider>
  );
}
