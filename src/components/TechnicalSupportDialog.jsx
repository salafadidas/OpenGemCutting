import { useRef, useState } from 'react';
import { IconArrowUpRight, IconBrandGithub, IconBug, IconCopy, IconFileText, IconHeadset, IconMessages, IconNews, IconQrcode, IconUsers, IconX } from '@tabler/icons-react';
import { APP_VERSION } from '../version.js';
import { getLocale, t } from '../i18n/locale.js';
import { TECHNICAL_SUPPORT as support, createSupportDiagnostics } from '../application/technicalSupport.js';
import { useDialogFocus } from './useDialogFocus.js';

const sections = [['team', '官方团队', IconUsers], ['feedback', '反馈与技术支持', IconMessages], ['license', '源码与使用许可', IconFileText], ['news', '团队动态', IconNews]];
const base = import.meta.env.BASE_URL;
function ExternalLink({ href, children, className = '', icon: Icon }) {
  return <a href={href} className={className} target="_blank" rel="noopener noreferrer">{Icon && <Icon size={18} aria-hidden="true" />}{children}<IconArrowUpRight size={14} aria-hidden="true" /></a>;
}
function CommunityLinks() {
  return <div className="support-community-links"><ExternalLink href={support.issues} icon={IconBug}>{t('报告问题 · Issues')}</ExternalLink><ExternalLink href={support.discussions} icon={IconMessages}>{t('交流想法 · Discussions')}</ExternalLink></div>;
}
function TestGroup({ panelRef }) {
  return <div className="support-test-group" ref={panelRef} tabIndex={-1}>
    <a href={`${base}${support.testGroupQr}`} target="_blank" rel="noopener noreferrer" aria-label={t('查看测试群二维码大图')}><img src={`${base}${support.testGroupQr}`} alt={t('企业微信二维码：加入余博士开源技术群')} /><span>{t('点击查看大图')}</span></a>
  </div>;
}
function Diagnostics({ source }) {
  const [report, setReport] = useState('');
  const [message, setMessage] = useState('');
  const textRef = useRef(null);
  const preview = () => {
    setReport(createSupportDiagnostics({ version: APP_VERSION, locale: getLocale(), userAgent: navigator.userAgent, width: window.innerWidth, height: window.innerHeight, pixelRatio: window.devicePixelRatio, webgl2: Boolean(window.WebGL2RenderingContext), webgpu: Boolean(navigator.gpu), source }));
    setMessage('');
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(report); setMessage('诊断信息已复制，请粘贴到问题描述中。'); }
    catch { textRef.current.focus(); textRef.current.select(); setMessage('无法自动复制，已选中内容，请手动复制。'); }
  };
  return <section className="support-diagnostics" aria-label={t('诊断信息')}>
    <div><h3>{t('报告问题前')}</h3><p>{t('查看版本、浏览器及图形接口信息，帮助团队定位问题。')}</p></div>
    <button type="button" className="support-outline" onClick={preview}><IconFileText size={17} />{t(report ? '刷新诊断信息' : '查看诊断信息')}</button>
    <p className="support-diagnostics-note">{t('仅在你点击后生成。不含设计文件、项目名称、地址或错误日志，不自动上传。')}</p>
    {report && <><textarea ref={textRef} readOnly aria-label={t('诊断信息预览')} value={report} rows={9} /><button type="button" className="support-outline" onClick={copy}><IconCopy size={17} />{t('复制诊断信息')}</button></>}
    {message && <p role="status">{t(message)}</p>}
  </section>;
}

export function TechnicalSupportDialog({ initialSection = 'team', source, onClose }) {
  const [section, setSection] = useState(initialSection);
  const [groupNotice, setGroupNotice] = useState(false);
  const panelRef = useRef(null);
  const groupRef = useRef(null);
  const contentRef = useRef(null);
  useDialogFocus(panelRef, onClose);
  const select = key => { setSection(key); contentRef.current?.scrollTo(0, 0); };
  const showGroup = () => { setGroupNotice(true); groupRef.current?.scrollIntoView({ block: 'nearest' }); groupRef.current?.focus({ preventScroll: true }); };
  return <div className="modal-backdrop support-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panelRef} className="support-dialog" role="dialog" aria-modal="true" aria-labelledby="support-title" tabIndex={-1}>
      <header className="support-header"><div><h2 id="support-title">{t('技术支持')}</h2><span>OpenGemCutting · SUVA</span></div><button type="button" aria-label={t('关闭技术支持')} onClick={onClose}><IconX size={23} stroke={1.5} /></button></header>
      <div className="support-body">
        <nav aria-label={t('技术支持栏目')}>{sections.map(([key, label, Icon]) => <button type="button" key={key} className={section === key ? 'is-active' : ''} aria-current={section === key ? 'page' : undefined} onClick={() => select(key)}><Icon size={21} stroke={1.6} />{t(label)}</button>)}</nav>
        <div className="support-content" ref={contentRef}>
          {section === 'team' && <>
            <section className="support-team"><div className="support-team-heading"><div className="support-brand"><img src={`${base}brand/logo-header.webp`} alt={t('苏哇品牌标志')} /><strong>SUVA</strong></div><div><h3>{support.team}</h3><p>{t('宝石切型工作台的官方团队')}</p></div></div><p>{t('我们专注于用技术探索宝石切型的可能性，持续改进切磨工作台。')}</p><div className="support-repository"><ExternalLink href={support.repository} className="support-outline" icon={IconBrandGithub}>{t('GitHub 仓库')}</ExternalLink><span>github.com/yuyou-dev/OpenGemCutting</span></div></section>
            <section className="support-testing"><div><h3>{t('参与测试，一起把工具做好')}</h3><p>{t('加入软件测试群，交流使用体验与问题。你的反馈能帮助我们改进工作台。')}</p><button type="button" className="support-primary" onClick={showGroup}>{t('加入测试群')}<IconQrcode size={17} /></button><CommunityLinks />{groupNotice && <p className="support-group-notice" role="status">{t('扫描企业微信二维码加入余博士开源技术群；点击二维码可查看大图。')}</p>}</div><TestGroup panelRef={groupRef} /></section>
            <section className="support-assistance"><IconHeadset size={27} stroke={1.5} /><div><strong>{t('需要协助？')} <button type="button" className="support-text-button" onClick={() => select('feedback')}>{t('联系官方团队')} →</button></strong><p>{t('使用问题、故障或建议，都可以从这里找到提交入口。')}</p></div><button type="button" className="support-text-button support-diagnostic-shortcut" onClick={() => select('feedback')}><IconFileText size={18} />{t('诊断信息')}<small>{t('查看后复制；不含设计文件')}</small></button></section>
          </>}
          {section === 'feedback' && <>
            <h3 className="support-section-title">{t('让问题得到准确的反馈')}</h3><p>{t('遇到问题或有想法？你的反馈能帮助我们改进工作台。')}</p>
            <div className="support-routes"><ExternalLink href={support.issues} icon={IconBug}><span><strong>{t('报告故障 · GitHub Issues')}</strong><small>{t('说明复现步骤、期望与实际结果，并附浏览器和版本。')}</small></span></ExternalLink><ExternalLink href={support.discussions} icon={IconMessages}><span><strong>{t('想法与使用疑问 · GitHub Discussions')}</strong><small>{t('描述你的切型设计场景，交流操作方法与改进建议。')}</small></span></ExternalLink></div>
            <Diagnostics source={source} />
            <section className="support-contact"><h3>{t('联系官方团队')}</h3><p>{t('扫描企业微信二维码加入余博士开源技术群；点击二维码可查看大图。')}</p><button type="button" className="support-outline" onClick={() => select('team')}>{t('查看测试群二维码')}</button><p>{t('GitHub 发帖需要登录；复制诊断信息不需要账号。只提交你愿意公开的内容。')}</p><ExternalLink href={support.security}>{t('安全漏洞或敏感信息：查看私下报告方式')}</ExternalLink></section>
          </>}
          {section === 'license' && <>
            <h3 className="support-section-title">{t('源码与使用许可')}</h3><p className="support-license-lead">{t('新原创内容仅限个人非商业自用')}</p><p>{t('禁止商用与二次分发。公司内部使用、接单设计，以及设计或加工用于出售的宝石，均不在这项授权范围内。')}</p><h4>{t('保留原有授权与作者权益')}</h4><p>{t('历史 MIT 内容及第三方材料仍按各自许可使用。你仍拥有自己的原创设计输出。完整适用范围以许可文件为准。')}</p><p>{t('公开源码便于学习与核查，不代表新原创内容采用不受限制的开源许可。SUVA 品牌与标志的使用不代表官方认可或授权。')}</p><div className="support-license-links"><ExternalLink href={support.licensing}>{t('查看完整许可与历史 MIT 说明')}</ExternalLink><ExternalLink href={support.license}>{t('正式许可条款')}</ExternalLink><ExternalLink href={support.trademarks}>{t('品牌与标志使用说明')}</ExternalLink><ExternalLink href={support.contributing}>{t('参与反馈与贡献')}</ExternalLink></div>
          </>}
          {section === 'news' && <><h3 className="support-section-title">{t('团队动态')}</h3><p>{t('这里将展示官方团队发布的内容。目前的软件更新请查看 GitHub 发布记录。')}</p><ExternalLink href={support.releases} className="support-outline" icon={IconNews}>{t('查看发布记录')}</ExternalLink></>}
        </div>
      </div>
      <footer className="support-footer"><IconFileText size={23} stroke={1.5} /><strong>{t('源码与使用许可')}</strong><span>{t('新原创内容仅限个人非商业自用 · 禁止商用与二次分发')}</span><ExternalLink href={support.licensing}>{t('查看完整许可与历史 MIT 说明')}</ExternalLink></footer>
    </section>
  </div>;
}
