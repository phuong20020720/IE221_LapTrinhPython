import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CalendarRange, RefreshCw, Stethoscope, UsersRound } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "../features/auth/AuthContext";
import { getDashboardSummary, type DashboardSummary } from "../shared/api/dashboard";

const metricCards = [
  { key: "appointments_today", label: "Lịch hôm nay", hint: "Lịch cần tiếp nhận trong ngày", icon: CalendarCheck2 },
  { key: "appointments_total", label: "Tổng lịch ghi nhận", hint: "Không bao gồm lịch đã hủy", icon: CalendarRange },
  { key: "patients_total", label: "Bệnh nhân", hint: "Tổng hồ sơ đã ghi nhận", icon: UsersRound },
  { key: "doctors_total", label: "Bác sĩ hoạt động", hint: "Đội ngũ đang tiếp nhận khám", icon: Stethoscope },
] as const;

function localInputDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(`${value}T00:00:00`));
}

function WeeklyAppointmentChart({ data }: { data: DashboardSummary["appointments_by_weekday"] }) {
  const maximum = Math.max(1, ...data.map((item) => item.count));
  return (
    <div className="dashboard-bar-chart" role="img" aria-label="Số lịch hẹn từ thứ Hai đến thứ Bảy tuần này">
      {data.map((item) => (
        <div className="dashboard-bar-chart__item" key={item.date} aria-label={`${item.label}, ${item.count} lịch`}>
          <strong>{item.count}</strong>
          <div className="dashboard-bar-chart__track">
            <span style={{ height: item.count === 0 ? "3px" : `${Math.max(10, (item.count / maximum) * 100)}%` }} />
          </div>
          <b>{item.label}</b>
          <small>{formatShortDate(item.date)}</small>
        </div>
      ))}
    </div>
  );
}

function PatientMonthChart({ data }: { data: DashboardSummary["patients_by_month"] }) {
  const maximum = Math.max(1, ...data.map((item) => item.count));
  const points = data.map((item, index) => {
    const x = 54 + index * 102;
    const y = 166 - (item.count / maximum) * 112;
    return { ...item, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `54,166 ${line} ${points.at(-1)?.x ?? 564},166`;

  return (
    <div className="dashboard-line-chart" role="img" aria-label="Số bệnh nhân mới trong sáu tháng gần nhất">
      <svg viewBox="0 0 620 220" aria-hidden="true">
        {[54, 110, 166].map((y) => <line key={y} x1="42" y1={y} x2="580" y2={y} className="dashboard-line-chart__grid" />)}
        <polygon points={area} className="dashboard-line-chart__area" />
        <polyline points={line} className="dashboard-line-chart__line" />
        {points.map((point) => (
          <g key={point.month}>
            <circle cx={point.x} cy={point.y} r="5" className="dashboard-line-chart__dot" />
            <text x={point.x} y={Math.max(22, point.y - 13)} className="dashboard-line-chart__value">{point.count}</text>
            <text x={point.x} y="198" className="dashboard-line-chart__label">{point.label}</text>
          </g>
        ))}
      </svg>
      <ul className="sr-only">
        {data.map((item) => <li key={item.month}>{item.label}: {item.count} bệnh nhân</li>)}
      </ul>
    </div>
  );
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [weekDate, setWeekDate] = useState(localInputDate);
  const [month, setMonth] = useState(() => localInputDate().slice(0, 7));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void getDashboardSummary({ weekDate, month })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Không thể tải dữ liệu tổng quan.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [month, reload, weekDate]);

  const weekRange = useMemo(() => {
    const days = data?.appointments_by_weekday;
    if (!days?.length) return "Thứ Hai đến Thứ Bảy";
    return `${formatShortDate(days[0].date)} – ${formatShortDate(days[days.length - 1].date)}`;
  }, [data]);

  return (
    <section className="admin-panel admin-dashboard">
      <header className="admin-panel__header">
        <div>
          <p className="eyebrow">TỔNG QUAN VẬN HÀNH</p>
          <h1>Chào {user?.full_name},</h1>
          <p>Theo dõi lịch khám trong tuần và xu hướng bệnh nhân mới của phòng khám.</p>
        </div>
        <span className="admin-date-chip">Hôm nay · {new Intl.DateTimeFormat("vi-VN").format(new Date())}</span>
      </header>

      {error ? (
        <Alert variant="destructive" className="dashboard-alert">
          <AlertDescription>{error}</AlertDescription>
          <Button type="button" variant="outline" size="sm" onClick={() => setReload((value) => value + 1)}>
            <RefreshCw aria-hidden="true" /> Thử lại
          </Button>
        </Alert>
      ) : null}

      <div className="admin-summary-grid">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card className="admin-summary-card" key={card.key}>
              <div className="admin-summary-card__content">
                <div>
                  <span className="admin-summary-card__label">{card.label}</span>
                  <strong>{loading ? "—" : (data?.summary[card.key] ?? 0)}</strong>
                  <small>{card.hint}</small>
                </div>
                <span className={`admin-summary-card__icon admin-summary-card__icon--${index + 1}`} aria-hidden="true">
                  <Icon size={19} />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="dashboard-chart-grid">
        <Card className="admin-dashboard-card dashboard-chart-card">
          <CardHeader className="dashboard-chart-card__heading">
            <div><p className="eyebrow">TUẦN ĐÃ CHỌN</p><CardTitle role="heading" aria-level={2}>Lịch hẹn theo ngày</CardTitle></div>
            <label className="dashboard-period-control">
              <span>{weekRange}</span>
              <Input aria-label="Chọn tuần thống kê" type="date" value={weekDate} onChange={(event) => setWeekDate(event.target.value)} />
            </label>
          </CardHeader>
          <CardContent>
            {loading ? <div className="dashboard-chart-state">Đang tải biểu đồ...</div> : <WeeklyAppointmentChart data={data?.appointments_by_weekday ?? []} />}
          </CardContent>
        </Card>

        <Card className="admin-dashboard-card dashboard-chart-card">
          <CardHeader className="dashboard-chart-card__heading">
            <div><p className="eyebrow">6 THÁNG KẾT THÚC TẠI MỐC CHỌN</p><CardTitle role="heading" aria-level={2}>Bệnh nhân mới theo tháng</CardTitle></div>
            <label className="dashboard-period-control">
              <span>Tính theo ngày tạo hồ sơ</span>
              <Input aria-label="Chọn tháng thống kê" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </label>
          </CardHeader>
          <CardContent>
            {loading ? <div className="dashboard-chart-state">Đang tải biểu đồ...</div> : <PatientMonthChart data={data?.patients_by_month ?? []} />}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
