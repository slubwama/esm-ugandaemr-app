import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, QrCode, Link } from '@carbon/react/icons';
import { Button, InlineLoading, TextInput } from '@carbon/react';
import styles from './mobile-connection.scss';

const MobileConnection: React.FC = () => {
  const { t } = useTranslation();
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the base URL (protocol + hostname + port)
    const url = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
    setCurrentUrl(url);
    setLoading(false);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <InlineLoading description={t('loading', 'Loading...')} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <QrCode size={32} />
        <div>
          <h2>{t('mobileConnection', 'Mobile Connection')}</h2>
          <p>{t('mobileConnectionDesc', 'Connect your mobile device to access this system')}</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.qrSection}>
          <div className={styles.qrCodeContainer}>
            <QRCodeSVG
              value={currentUrl}
              size={200}
              level="M"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <p className={styles.scanHint}>
            {t('scanQrCode', 'Scan this QR code with your mobile device')}
          </p>
        </div>

        <div className={styles.urlSection}>
          <div className={styles.urlHeader}>
            <Link size={20} />
            <h3>{t('currentUrl', 'Current URL')}</h3>
          </div>
          <div className={styles.urlInputContainer}>
            <TextInput
              id="mobile-connection-url"
              labelText=""
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              placeholder="http://192.168.1.100:8080"
              className={styles.urlInput}
            />
            <Button
              kind="ghost"
              hasIconOnly
              iconDescription={copied ? t('copied', 'Copied!') : t('copy', 'Copy')}
              onClick={handleCopy}
              tooltipAlignment="center"
              tooltipPosition="bottom">
              <Copy size={20} />
            </Button>
          </div>
          {copied && (
            <p className={styles.copiedMessage}>
              {t('urlCopied', 'URL copied to clipboard')}
            </p>
          )}
        </div>

        <div className={styles.infoSection}>
          <h4>{t('howToConnect', 'How to connect')}</h4>
          <ol className={styles.stepsList}>
            <li>{t('step1', 'Ensure your mobile device is on the same network as this computer')}</li>
            <li>{t('step2', 'Open your camera or QR code scanner app on your mobile device')}</li>
            <li>{t('step3', 'Scan the QR code above to navigate to this page')}</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MobileConnection;
