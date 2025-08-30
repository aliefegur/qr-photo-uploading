import {Rubik} from 'next/font/google';
import {ReactNode} from "react";
import './globals.css';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEnvelope, faGlobe, faPhone} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import {Metadata} from "next";

const rubik = Rubik({
  variable: '--font-rubik',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: "Oğuzhan ve Hatice",
  description: "Oğuzhan ve Hatice'nin düğünü için medya paylaşım portalı."
}

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="tr">
    <body className={`${rubik.className} antialiased`}>
    {children}

    <footer
      className={`${rubik.className} px-8 py-8 bg-gray-400 flex flex-col gap-6`}>
      <div className="flex flex-col items-baseline max-md:gap-6 md:flex-row md:items-start md:justify-center gap-6">
        <Image src={"/davetiye.jpg"} alt={"Düğün davetiyesi"} width={512} height={512}
               className="max-h-[80vh] object-contain"/>
        <div className="flex flex-col gap-1 max-md:w-full">
          <h6 className="font-medium text-lg">İletişim</h6>
          <a href="https://aliefegur.com" target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1">
            <FontAwesomeIcon icon={faGlobe}/>
            <p>aliefegur.com</p>
          </a>
          <a href="mailto:ali.efe.gur@hotmail.com" target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1">
            <FontAwesomeIcon icon={faEnvelope}/>
            <p>ali.efe.gur@hotmail.com</p>
          </a>
          <a href="tel:+905550232004" target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1">
            <FontAwesomeIcon icon={faPhone}/>
            <p>+90 555 023 2004</p>
          </a>
          <p className="max-md:self-center text-sm font-light mt-6">Ali Efe GÜR © 2025 - Tüm Hakları Saklıdır</p>
        </div>
      </div>
    </footer>
    </body>
    </html>
  );
}
