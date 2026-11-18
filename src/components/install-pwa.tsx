import { useEffect, useState } from "react";
import { Share, SquarePlus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPwaButton() {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<PromptEvent | null>(null);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) setVisible(true);
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as PromptEvent); setVisible(true); };
    const onInstalled = () => { setVisible(false); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  if (!visible) return null;
  const click = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setDeferred(null);
      if (outcome === "accepted") setVisible(false);
    } else if (ios) setHelp(true);
  };
  return (
    <>
      <Button variant="outline" size="sm" className="install-pwa" onClick={() => void click()}>
        <Smartphone size={15} />📲 Instalar App
      </Button>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="install-help">
          <DialogTitle>Adicionar à Tela de Início</DialogTitle>
          <DialogDescription>Leve o Amigos Fair Play como app no seu iPhone em 2 passos.</DialogDescription>
          <ol>
            <li><span>1</span>Toque no botão <strong>Compartilhar</strong> <Share size={16} /> do Safari.</li>
            <li><span>2</span>Toque em <strong>Adicionar à Tela de Início</strong> <SquarePlus size={16} />.</li>
          </ol>
          <Button onClick={() => setHelp(false)}>Entendi</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
