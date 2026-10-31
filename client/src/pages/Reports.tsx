import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertTriangle, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import { api, getErrorMessage, type ContentType, type Report, type ReportStatus, type ReportsResponse } from '../api/client';

const types: Array<{ label: string; value: ContentType | '' }> = [
    { label: 'All reports', value: '' },
    { label: 'Posts', value: 'POST' },
    { label: 'Profiles', value: 'PROFILE' },
    { label: 'Messages', value: 'MESSAGE' },
    { label: 'Businesses', value: 'BUSINESS' },
];

const statusOptions: Array<{ label: string; value: ReportStatus | '' }> = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
    { label: 'Deleted', value: 'DELETED' },
    { label: 'All statuses', value: '' },
];

function display(value: unknown) {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function contentTitle(report: Report) {
    if (!report.content) return 'Content already removed';
    const content = report.content;
    switch (report.contentType) {
        case 'POST':
            return display(content.title) || display(content.description) || 'Post';
        case 'PROFILE':
            return display(content.fullName) || 'Profile';
        case 'MESSAGE':
            return display(content.content) || 'Message';
        case 'BUSINESS':
            return display(content.name) || 'Business';
    }
}

function imageUrls(content: NonNullable<Report['content']>) {
    return Array.isArray(content.imageUrls)
        ? content.imageUrls.filter((url): url is string => typeof url === 'string')
        : [];
}

function dateLabel(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function Reports() {
    const queryClient = useQueryClient();
    const [contentType, setContentType] = useState<ContentType | ''>('');
    const [status, setStatus] = useState<ReportStatus | ''>('PENDING');
    const [page, setPage] = useState(1);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Report | null>(null);
    const [actionError, setActionError] = useState('');
    const [workingId, setWorkingId] = useState('');
    const limit = 10;

    const { data, isPending, isFetching, error } = useQuery({
        queryKey: ['admin-reports', contentType, status, page, limit],
        queryFn: async () => (await api.get<ReportsResponse>('/reports', {
            params: { ...(contentType ? { contentType } : {}), ...(status ? { status } : {}), page, limit },
        })).data,
    });

    async function resolveReport(report: Report, action: 'acknowledge' | 'delete') {
        setWorkingId(report.id);
        setActionError('');
        try {
            const response = await api.post<{ resolvedCount: number }>(`/reports/${encodeURIComponent(report.id)}/${action}`);
            setPendingDelete(null);
            setSelectedReport(null);
            setActionError('');
            window.dispatchEvent(new CustomEvent('admin:toast', {
                detail: `${response.data.resolvedCount} report${response.data.resolvedCount === 1 ? '' : 's'} ${action === 'acknowledge' ? 'acknowledged' : 'resolved'}.`,
            }));
            await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
        } catch (actionFailure) {
            if (axios.isAxiosError(actionFailure) && actionFailure.response?.status === 409) {
                setActionError('This report was already resolved. The list has been refreshed.');
                await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            } else {
                setActionError(getErrorMessage(actionFailure, 'Could not complete this action. Please try again.'));
            }
        } finally {
            setWorkingId('');
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

    return (
        <div className="page-stack">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">MODERATION</p>
                    <h1>Reports</h1>
                    <p className="muted">Review reports and take action on content that violates community standards.</p>
                </div>
                <span className="queue-count">{data?.total ?? 0} total reports</span>
            </div>

            <section className="panel reports-panel">
                <div className="reports-toolbar">
                    <div className="report-tabs" role="tablist" aria-label="Filter reports by content type">
                        {types.map((type) => (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={contentType === type.value}
                                className={`report-tab${contentType === type.value ? ' selected' : ''}`}
                                key={type.label}
                                onClick={() => { setContentType(type.value); setPage(1); }}
                            >{type.label}</button>
                        ))}
                    </div>
                    <label className="status-filter">
                        <span>Status</span>
                        <select value={status} onChange={(event) => { setStatus(event.target.value as ReportStatus | ''); setPage(1); }}>
                            {statusOptions.map((option) => <option value={option.value} key={option.label}>{option.label}</option>)}
                        </select>
                    </label>
                </div>

                {actionError && <div className="alert alert-error action-alert" role="alert">{actionError}</div>}
                {error && <div className="alert alert-error action-alert" role="alert">Couldn’t load reports. {getErrorMessage(error, 'Please try again.')}</div>}
                {isPending ? <div className="loading-panel"><span className="spinner" />Loading reports…</div> : (
                    <div className={`table-wrap${isFetching ? ' table-refreshing' : ''}`}>
                        <table className="reports-table">
                            <thead><tr>
                                <th>Content</th><th>Reason</th><th>Reported</th><th>Status</th><th aria-label="Actions" />
                            </tr></thead>
                            <tbody>
                                {data?.data.map((report) => (
                                    <tr key={report.id}>
                                        <td>
                                            <button type="button" className="content-cell" onClick={() => setSelectedReport(report)}>
                                                <span className={`type-dot type-${report.contentType.toLowerCase()}`} />
                                                <span><strong>{contentTitle(report)}</strong><small>{report.contentType.toLowerCase()}</small></span>
                                            </button>
                                        </td>
                                        <td><span className="reason-label">{report.reason}</span>{report.details && <small className="reason-detail">{report.details}</small>}</td>
                                        <td className="date-cell">{dateLabel(report.reportedAt)}</td>
                                        <td><span className={`status-badge status-${report.status.toLowerCase()}`}>{report.status.toLowerCase()}</span></td>
                                        <td><button className="icon-button" aria-label="View report details" onClick={() => setSelectedReport(report)}><Eye size={17} /></button></td>
                                    </tr>
                                ))}
                                {!data?.data.length && <tr><td className="empty-table" colSpan={5}>No reports match these filters.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                <footer className="pagination">
                    <span>{data ? `${data.total === 0 ? 0 : (page - 1) * limit + 1}–${Math.min(page * limit, data.total)} of ${data.total}` : ' '}</span>
                    <div className="pagination-actions">
                        <button className="button button-secondary page-button" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={16} />Previous</button>
                        <span>Page {page} of {totalPages}</span>
                        <button className="button button-secondary page-button" disabled={page >= totalPages || isFetching} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next<ChevronRight size={16} /></button>
                    </div>
                </footer>
            </section>

            {selectedReport && (
                <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedReport(null); }}>
                    <aside className="detail-drawer" aria-label="Report details">
                        <div className="drawer-heading">
                            <div><p className="eyebrow">REPORT DETAILS</p><h2>{selectedReport.contentType.toLowerCase()} report</h2></div>
                            <button className="icon-button" aria-label="Close details" onClick={() => setSelectedReport(null)}><X size={19} /></button>
                        </div>
                        <div className="drawer-meta">
                            <span className={`status-badge status-${selectedReport.status.toLowerCase()}`}>{selectedReport.status.toLowerCase()}</span>
                            <span>{dateLabel(selectedReport.reportedAt)}</span>
                        </div>
                        <div className="detail-section"><label>Reason</label><p>{selectedReport.reason}</p></div>
                        {selectedReport.details && <div className="detail-section"><label>Additional details</label><p>{selectedReport.details}</p></div>}
                        <div className="detail-section"><label>Reported content</label>
                            {!selectedReport.content ? <p className="muted">Content already removed.</p> : (
                                <ContentDetail report={selectedReport} />
                            )}
                        </div>
                        {selectedReport.resolvedAt && <div className="detail-section"><label>Resolved</label><p>{dateLabel(selectedReport.resolvedAt)}</p></div>}
                        {selectedReport.status === 'PENDING' && <div className="drawer-actions">
                            <button className="button button-secondary full-width" disabled={workingId === selectedReport.id} onClick={() => void resolveReport(selectedReport, 'acknowledge')}>Ignore report</button>
                            <button className="button button-danger full-width" disabled={workingId === selectedReport.id} onClick={() => setPendingDelete(selectedReport)}>Delete content</button>
                        </div>}
                    </aside>
                </div>
            )}

            {pendingDelete && <div className="modal-backdrop" role="presentation">
                <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                    <span className="warning-icon"><AlertTriangle size={23} /></span>
                    <h2 id="confirm-title">{pendingDelete.contentType === 'PROFILE' ? 'Permanently delete this profile?' : 'Delete reported content?'}</h2>
                    {pendingDelete.contentType === 'PROFILE'
                        ? <p>This permanently deletes the profile, deactivates its user, and logs them out everywhere. This action cannot be undone.</p>
                        : <p>This removes the reported content and marks all pending reports for the same content as deleted.</p>}
                    <div className="modal-actions">
                        <button className="button button-secondary" disabled={workingId === pendingDelete.id} onClick={() => setPendingDelete(null)}>Cancel</button>
                        <button className="button button-danger" disabled={workingId === pendingDelete.id} onClick={() => void resolveReport(pendingDelete, 'delete')}>
                            {workingId === pendingDelete.id ? 'Deleting…' : pendingDelete.contentType === 'PROFILE' ? 'Permanently delete' : 'Delete content'}
                        </button>
                    </div>
                </section>
            </div>}
        </div>
    );
}

function ContentDetail({ report }: { report: Report }) {
    const content = report.content;
    if (!content) return null;

    if (report.contentType === 'PROFILE') {
        const photo = display(content.profilePhoto);
        return <div className="content-detail">
            {photo && <img className="profile-photo" src={photo} alt="" />}
            <strong>{display(content.fullName) || 'Unnamed profile'}</strong>
            <p>{display(content.description)}</p>
            <small>{[display(content.jnvDistrict), display(content.jnvState)].filter(Boolean).join(', ')}</small>
        </div>;
    }

    if (report.contentType === 'MESSAGE') {
        return <div className="content-detail">
            <p className="quoted-content">{display(content.content) || 'No message text'}</p>
            <small>{display(content.messageType)}{content.isDeleted === true ? ' · Deleted' : ''}</small>
            {typeof content.mediaUrl === 'string' && <a href={content.mediaUrl} target="_blank" rel="noreferrer">Open message media</a>}
        </div>;
    }

    const business = report.contentType === 'BUSINESS';
    const heading = business ? display(content.name) : display(content.title);
    const description = display(content.description);
    const images = imageUrls(content);
    return <div className="content-detail">
        <strong>{heading || (business ? 'Business listing' : 'Post')}</strong>
        {business && <small>{display(content.category)}{content.ownerName ? ` · ${display(content.ownerName)}` : ''}</small>}
        {description && <p className="quoted-content">{description}</p>}
        {images.length > 0 && <div className="content-images">{images.map((url, index) => <img src={url} alt={`${business ? 'Business' : 'Post'} image ${index + 1}`} key={`${url}-${index}`} />)}</div>}
        <small>Created {display(content.createdAt) ? dateLabel(display(content.createdAt)) : 'date unavailable'}</small>
    </div>;
}
