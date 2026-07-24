/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { auth, db } from "@/app/lib/firebase"
import { getQuizDef } from "@/app/data/quizCatalog"

type AnyRecord = Record<string, any>
type LearnerRow = {
  id: string
  name: string
  email: string
  count: number
  score: number | null
  last: Date | null
  status: string
  course: string
  correct: number
  answered: number
  courseMetrics: CourseMetric[]
}
type CourseMetric = {
  course: string
  studyCount: number
  correct: number
  answered: number
}
type CourseStat = {
  course: string
  learners: number
  studyCount: number
  averageScore: number | null
  studying: number
  followUp: number
  notStarted: number
}
type LoadError = "permission" | "general" | null

const tabs = ["Dashboard", "Learners", "Analytics", "Reports", "Company"] as const

const toDate = (value: any): Date | null => {
  if (!value) return null
  const parsed =
    typeof value.toDate === "function"
      ? value.toDate()
      : value.seconds
        ? new Date(value.seconds * 1000)
        : typeof value === "number" && value < 100000000000
          ? new Date(value * 1000)
          : new Date(value)
  return Number.isNaN(parsed.getTime()) || parsed.getTime() > Date.now() + 86400000 ? null : parsed
}

const scoredParts = (result: AnyRecord): { correct: number; answered: number } | null => {
  if (result.completed === false || result.finished === false || result.byTimeout === true) return null
  if (!result.completedAt && !result.createdAt) return null
  const correct = Number(result.correctCount ?? result.score)
  const answered = Number(result.totalQuestions ?? result.answeredCount ?? result.total)
  if (
    !Number.isFinite(correct) ||
    !Number.isFinite(answered) ||
    answered <= 0 ||
    correct < 0 ||
    correct > answered
  ) {
    return null
  }
  return { correct, answered }
}

const percent = (value: number | null) =>
  value == null ? "採点対象外" : `${Math.round(value)}%`
const formatDate = (value: Date | null) => (value ? value.toLocaleDateString("ja-JP") : "—")
const courseLabel = (id: string) => {
  try {
    return getQuizDef(id)?.title ?? id
  } catch {
    return id || "教材未設定"
  }
}
const jstDay = (value: Date) => Math.floor((value.getTime() + 32400000) / 86400000)

export default function BusinessDashboard({
  appName,
  appHomeHref,
  appHomeLabel = "アプリへ戻る",
  loginHref = "/company/login",
  companyField = "companyCode",
}: {
  appName: string
  appHomeHref: string
  appHomeLabel?: string
  loginHref?: string
  companyField?: "companyCode" | "companyId"
}) {
  const router = useRouter()
  const [tab, setTab] = useState<(typeof tabs)[number]>("Dashboard")
  const [rows, setRows] = useState<LearnerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<LoadError>(null)
  const [companyMissing, setCompanyMissing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [company, setCompany] = useState<AnyRecord>({})
  const [code, setCode] = useState("")
  const [role, setRole] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("すべて")
  const [sort, setSort] = useState("last")
  const [menu, setMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    setLoading(true)
    setLoadError(null)
    setCompanyMissing(false)
    setRole("")

    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace(loginHref)
        return
      }

      try {
        const mySnapshot = await getDoc(doc(db, "users", user.uid))
        if (!mySnapshot.exists()) throw Error("管理者情報が見つかりません。")

        const me = mySnapshot.data() as AnyRecord
        const role = String(me.role ?? "")
        if (!["admin", "company_admin"].includes(role)) throw Error("閲覧権限がありません。")
        setRole(role)

        const companyCode = String(me[companyField] ?? "")
        setCode(companyCode)
        if (role === "company_admin" && !companyCode) {
          setCompany({ name: me.companyName })
          setRows([])
          return
        }
        if (companyCode) {
          const companySnapshot = await getDoc(doc(db, "companies", companyCode))
          setCompanyMissing(!companySnapshot.exists())
          setCompany(companySnapshot.exists() ? companySnapshot.data() : { name: me.companyName })
        }

        const users = collection(db, "users")
        const usersSnapshot =
          role === "admin" && !companyCode
            ? await getDocs(users)
            : await getDocs(query(users, where(companyField, "==", companyCode)))

        const people = usersSnapshot.docs
          .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as AnyRecord)
          .filter((person) => person.id !== user.uid && !String(person.role ?? "").includes("admin"))

        setRows(
          await Promise.all(
            people.map(async (person) => {
              const [resultsSnapshot, progressSnapshot] = await Promise.all([
                getDocs(collection(db, "users", person.id, "results")),
                getDocs(collection(db, "users", person.id, "progress")),
              ])
              const results = resultsSnapshot.docs
                .map((snapshot) => snapshot.data() as AnyRecord)
                .filter((result) =>
                  Boolean(
                    getQuizDef(
                      String(result.quizType ?? result.courseId ?? result.materialId ?? ""),
                    ),
                  ),
                )
              const progress = progressSnapshot.docs.map(
                (snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as AnyRecord,
              ).filter((item) =>
                Boolean(
                  getQuizDef(
                    String(item.quizType ?? item.courseId ?? item.materialId ?? item.id ?? ""),
                  ),
                ),
              )
              const scoredResults = results
                .map((result) => ({ result, parts: scoredParts(result) }))
                .filter(
                  (
                    item,
                  ): item is {
                    result: AnyRecord
                    parts: { correct: number; answered: number }
                  } => item.parts != null,
                )
              const metricMap = new Map<string, CourseMetric>()
              const dates = [
                ...scoredResults.map(({ result }) =>
                  toDate(result.completedAt ?? result.createdAt ?? result.lastStudyAt ?? result.updatedAt),
                ),
                ...progress.map((item) =>
                  toDate(
                    item.lastStudyAt ??
                      item.lastStudiedAt ??
                      item.completedAt ??
                      item.updatedAt ??
                      item.lastStudyDate,
                  ),
                ),
              ].filter((value): value is Date => Boolean(value))
              const last = dates.length
                ? new Date(Math.max(...dates.map((value) => value.getTime())))
                : null
              for (const { result, parts } of scoredResults) {
                const id = String(
                  result.quizType ?? result.courseId ?? result.materialId ?? "教材未設定",
                )
                const metric = metricMap.get(id) ?? {
                  course: courseLabel(id),
                  studyCount: 0,
                  correct: 0,
                  answered: 0,
                }
                metric.studyCount += 1
                metric.correct += parts.correct
                metric.answered += parts.answered
                metricMap.set(id, metric)
              }
              for (const item of progress) {
                const sessions = Number(item.totalSessions)
                if (!Number.isFinite(sessions) || sessions <= 0) continue
                const id = String(item.quizType ?? item.courseId ?? item.materialId ?? item.id)
                const metric = metricMap.get(id) ?? {
                  course: courseLabel(id),
                  studyCount: 0,
                  correct: 0,
                  answered: 0,
                }
                metric.studyCount += Math.floor(sessions)
                metricMap.set(id, metric)
              }
              const courseMetrics = [...metricMap.values()]
              const correct = courseMetrics.reduce((total, metric) => total + metric.correct, 0)
              const answered = courseMetrics.reduce((total, metric) => total + metric.answered, 0)
              const count = courseMetrics.reduce((total, metric) => total + metric.studyCount, 0)

              return {
                id: person.id,
                name: String(person.displayName ?? person.name ?? "名前未設定"),
                email: String(person.email ?? ""),
                count,
                score: answered > 0 ? (correct / answered) * 100 : null,
                correct,
                answered,
                courseMetrics,
                last,
                status: !count
                  ? "未学習"
                  : last && jstDay(new Date()) - jstDay(last) >= 7
                    ? "要フォロー"
                    : "学習中",
                course: courseMetrics[0]?.course ?? "教材未設定",
              }
            }),
          ),
        )
      } catch (error) {
        console.error("Business Dashboard data load failed", error)
        const firebaseCode =
          typeof error === "object" && error !== null && "code" in error
            ? String((error as { code?: unknown }).code)
            : ""
        setLoadError(
          firebaseCode === "permission-denied" || firebaseCode === "firestore/permission-denied"
            ? "permission"
            : "general",
        )
      } finally {
        setLoading(false)
      }
    })
  }, [router, loginHref, companyField, reloadKey])

  const shown = useMemo(
    () =>
      rows
        .filter(
          (row) =>
            (filter === "すべて" || row.status === filter) &&
            `${row.name} ${row.email}`.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name, "ja")
            : sort === "count"
              ? b.count - a.count
              : sort === "score"
                ? (b.score ?? -1) - (a.score ?? -1)
                : (b.last?.getTime() ?? 0) - (a.last?.getTime() ?? 0),
        ),
    [rows, search, filter, sort],
  )
  const totalCorrect = rows.reduce((total, row) => total + row.correct, 0)
  const totalAnswered = rows.reduce((total, row) => total + row.answered, 0)
  const overallAccuracy =
    totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : null
  const courseStats = useMemo<CourseStat[]>(() => {
    const grouped = new Map<
      string,
      {
        learners: number
        studyCount: number
        correct: number
        answered: number
        studying: number
        followUp: number
        notStarted: number
      }
    >()
    for (const row of rows) {
      for (const metric of row.courseMetrics) {
        const current = grouped.get(metric.course) ?? {
          learners: 0,
          studyCount: 0,
          correct: 0,
          answered: 0,
          studying: 0,
          followUp: 0,
          notStarted: 0,
        }
        current.learners += 1
        current.studyCount += metric.studyCount
        current.correct += metric.correct
        current.answered += metric.answered
        current.studying += row.status === "学習中" ? 1 : 0
        current.followUp += row.status === "要フォロー" ? 1 : 0
        current.notStarted += row.status === "未学習" ? 1 : 0
        grouped.set(metric.course, current)
      }
    }

    return [...grouped.entries()]
      .map(([course, values]) => ({
        course,
        learners: values.learners,
        studyCount: values.studyCount,
        averageScore:
          values.answered > 0 ? (values.correct / values.answered) * 100 : null,
        studying: values.studying,
        followUp: values.followUp,
        notStarted: values.notStarted,
      }))
      .sort((a, b) => b.studyCount - a.studyCount || a.course.localeCompare(b.course, "ja"))
  }, [rows])

  const exportCsv = () => {
    const data = [
      ["氏名", "メール", "状態", "学習回数", "平均正答率", "最終学習日", "教材"],
      ...shown.map((row) => [
        row.name,
        row.email,
        row.status,
        row.count,
        percent(row.score),
        formatDate(row.last),
        row.course,
      ]),
    ]
    const safe = (value: unknown) => {
      const text = String(value)
      return `"${["=", "+", "-", "@"].includes(text.charAt(0)) ? "'" : ""}${text.replaceAll('"', '""')}"`
    }
    const blob = new Blob(
      [`\uFEFF${data.map((row) => row.map(safe).join(",")).join("\r\n")}`],
      { type: "text/csv" },
    )
    const anchor = document.createElement("a")
    anchor.href = URL.createObjectURL(blob)
    anchor.download = `${appName}-learners-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(anchor.href)
  }

  const copyCode = async () => {
    if (!code) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = code
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        textarea.remove()
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch (error) {
      console.error("Company code copy failed", error)
      setNotice("企業コードをコピーできませんでした。手動で選択してコピーしてください。")
    }
  }

  if (loading) return <main style={styles.center}>読み込み中…</main>

  return (
    <div style={styles.shell}>
      <style>{responsive}</style>
      <aside className={menu ? "bdSide open" : "bdSide"} style={styles.side}>
        <div style={styles.sideTop}>
          <h2>OutIN Academy</h2>
          <small>
            Business Dashboard
            <br />
            企業向け学習管理画面
          </small>
          <b style={styles.app}>{appName}</b>
          {role === "company_admin" && (
            <CompanyCodeCard
              companyName={String(company.name ?? company.companyName ?? "")}
              code={code}
              copied={copied}
              onCopy={copyCode}
            />
          )}
          <a href={appHomeHref} style={{ color: "white", padding: 10 }}>
            {appHomeLabel}
          </a>
        </div>
        <nav style={styles.sideNav} aria-label="Business Dashboard">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => {
                setTab(item)
                setMenu(false)
              }}
              style={tab === item ? styles.activeNav : styles.nav}
            >
              {item}
            </button>
          ))}
        </nav>
        <div style={styles.logoutArea}>
          <button onClick={() => signOut(auth)} style={styles.nav}>
            ログアウト
          </button>
        </div>
      </aside>

      {menu && (
        <button
          className="bdScrim"
          onClick={() => setMenu(false)}
          aria-label="メニューを閉じる"
        />
      )}

      <main className="bdMain" style={styles.main}>
        <header style={styles.header}>
          <button className="bdHamb" onClick={() => setMenu(true)} aria-label="メニューを開く">
            ☰
          </button>
          <b>{tab}</b>
          <span>{company.name ?? company.companyName ?? code}</span>
        </header>
        <div style={styles.content}>
          {loadError ? (
            <LoadErrorCard kind={loadError} onRetry={() => setReloadKey((value) => value + 1)} />
          ) : (
            <>
              <h1>{tab}</h1>
              {companyMissing && (
                <InfoCard
                  title="企業情報が登録されていません"
                  body="企業コードに対応する企業情報を確認してください。"
                />
              )}
              {!companyMissing && rows.length === 0 && (
                <InfoCard
                  title="表示できる学習者データはありません"
                  body="学習者が登録されると、ここに学習状況が表示されます。"
                />
              )}
              {notice && <div style={styles.info}>{notice}</div>}

              {tab === "Dashboard" && (
                <>
                  <div style={styles.grid}>
                    <Card label="登録学習者数" value={rows.length} />
                    <Card
                      label="学習中"
                      value={rows.filter((row) => row.status === "学習中").length}
                    />
                    <Card
                      label="要フォロー"
                      value={rows.filter((row) => row.status === "要フォロー").length}
                    />
                    <Card
                      label="平均正答率"
                      value={percent(overallAccuracy)}
                    />
                  </div>
                  <p style={styles.accuracyNote}>
                    正答率は、正解数と回答数を取得できるクイズ・テストから集計しています。
                  </p>
                  <CourseProgress stats={courseStats} />
                </>
              )}

              {tab === "Learners" && (
                <>
                  <div style={styles.tools}>
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="氏名・メールで検索"
                      aria-label="氏名またはメールで検索"
                    />
                    <select
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                      aria-label="状態フィルター"
                    >
                      {["すべて", "未学習", "学習中", "要フォロー"].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                      aria-label="並び替え"
                    >
                      <option value="last">最終学習日</option>
                      <option value="name">氏名</option>
                      <option value="count">学習回数</option>
                      <option value="score">平均正答率</option>
                    </select>
                    <button onClick={exportCsv}>CSV出力</button>
                  </div>
                  <div style={styles.table}>
                    <table>
                      <thead>
                        <tr>
                          {["氏名", "状態", "学習回数", "平均正答率", "最終学習日", "教材"].map(
                            (item) => (
                              <th key={item}>{item}</th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {shown.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <b>{row.name}</b>
                              <small>{row.email}</small>
                            </td>
                            <td>{row.status}</td>
                            <td>{row.count}</td>
                            <td>{percent(row.score)}</td>
                            <td>{formatDate(row.last)}</td>
                            <td>{row.course}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "Analytics" && (
                <>
                  <div style={styles.card}>
                    全体平均正答率 {percent(overallAccuracy)}{" "}
                    ・ 学習中 {rows.filter((row) => row.status === "学習中").length}名
                    <p style={styles.accuracyNote}>
                      正答率は、正解数と回答数を取得できるクイズ・テストから集計しています。
                    </p>
                  </div>
                  <CourseAnalytics stats={courseStats} />
                </>
              )}
              {tab === "Reports" && (
                <div style={styles.card}>
                  <p>出力対象 {shown.length}件</p>
                  <button onClick={exportCsv}>学習者一覧CSVを出力</button>
                  <p>PDFレポートは準備中です。</p>
                </div>
              )}
              {tab === "Company" && (
                <div style={styles.card}>
                  <p>会社名: {String(company.name ?? company.companyName ?? "—")}</p>
                  <p>企業コード: {code || "—"}</p>
                  <p>契約状態: {String(company.status ?? "有効")}</p>
                  <p>登録学習者数: {rows.length}名</p>
                  <p>利用中のアプリ: {appName}</p>
                  <button onClick={copyCode} disabled={!code}>
                    {copied ? "コピーしました" : "企業コードをコピー"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function LoadErrorCard({
  kind,
  onRetry,
}: {
  kind: Exclude<LoadError, null>
  onRetry: () => void
}) {
  return (
    <section style={styles.errorCard} role="alert">
      <h1>データを読み込めませんでした</h1>
      <p>
        {kind === "permission"
          ? "企業管理画面の閲覧権限を確認してください。問題が続く場合は管理者へお問い合わせください。"
          : "企業管理画面の読み込み中に問題が発生しました。時間をおいて再度お試しください。"}
      </p>
      <button onClick={onRetry}>再読み込み</button>
    </section>
  )
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <section style={styles.info}>
      <b>{title}</b>
      <p>{body}</p>
    </section>
  )
}

function CompanyCodeCard({
  companyName,
  code,
  copied,
  onCopy,
}: {
  companyName: string
  code: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <section style={styles.companyCodeCard} aria-label="企業情報">
      {companyName && <b style={styles.companyName}>{companyName}</b>}
      <span style={styles.companyCodeLabel}>企業コード</span>
      <code style={styles.companyCode}>
        {code || "企業コードが登録されていません"}
      </code>
      <button
        type="button"
        onClick={onCopy}
        disabled={!code}
        aria-label={code ? "企業コードをコピー" : "企業コードが登録されていません"}
        style={styles.copyButton}
      >
        <span aria-live="polite">{copied ? "コピー済み" : "コピー"}</span>
      </button>
    </section>
  )
}

function CourseProgress({ stats }: { stats: CourseStat[] }) {
  if (!stats.length) return null
  return (
    <section style={styles.card}>
      <h2>教材別進捗</h2>
      <div style={styles.courseGrid}>
        {stats.map((stat) => (
          <article key={stat.course} style={styles.courseItem}>
            <b>{stat.course}</b>
            <p>
              学習中 {stat.studying}名 ・ 要フォロー {stat.followUp}名 ・ 未学習{" "}
              {stat.notStarted}名
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function CourseAnalytics({ stats }: { stats: CourseStat[] }) {
  if (!stats.length) return null
  return (
    <section style={styles.card}>
      <h2>教材別分析</h2>
      <div style={styles.table}>
        <table>
          <thead>
            <tr>
              <th>教材</th>
              <th>学習者数</th>
              <th>学習回数</th>
              <th>平均正答率</th>
              <th>進捗</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.course}>
                <td>
                  <b>{stat.course}</b>
                </td>
                <td>{stat.learners}</td>
                <td>{stat.studyCount}</td>
                <td>{percent(stat.averageScore)}</td>
                <td>
                  学習中 {stat.studying} / 要フォロー {stat.followUp} / 未学習{" "}
                  {stat.notStarted}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Card({ label, value }: { label: string; value: any }) {
  return (
    <article style={styles.card}>
      <span>{label}</span>
      <strong style={styles.number}>{value}</strong>
    </article>
  )
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100dvh",
    background: "#f5f7fb",
    color: "#10213b",
    fontFamily: "system-ui",
  },
  side: {
    position: "fixed",
    inset: "0 auto 0 0",
    zIndex: 30,
    width: 250,
    height: "100dvh",
    boxSizing: "border-box",
    padding: "22px 22px max(16px, env(safe-area-inset-bottom))",
    background: "#102342",
    color: "white",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  sideTop: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sideNav: {
    flex: "1 1 auto",
    minHeight: 0,
    overflowY: "auto",
    overscrollBehavior: "contain",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "8px 2px",
  },
  logoutArea: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    paddingTop: 10,
    borderTop: "1px solid #ffffff22",
  },
  app: { padding: "15px 0" },
  companyCodeCard: {
    display: "grid",
    gap: 5,
    minWidth: 0,
    padding: 10,
    border: "1px solid #ffffff2b",
    borderRadius: 10,
    background: "#ffffff10",
  },
  companyName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 13,
  },
  companyCodeLabel: {
    color: "#aebed4",
    fontSize: 11,
  },
  companyCode: {
    maxWidth: "100%",
    color: "white",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 12,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  copyButton: {
    justifySelf: "start",
    padding: "6px 10px",
    border: "1px solid #ffffff3d",
    borderRadius: 8,
    background: "#ffffff18",
    color: "white",
  },
  nav: {
    flexShrink: 0,
    padding: 12,
    border: 0,
    borderRadius: 10,
    background: "transparent",
    color: "#ccd7e8",
    textAlign: "left",
  },
  activeNav: {
    flexShrink: 0,
    padding: 12,
    border: 0,
    borderRadius: 10,
    background: "white",
    color: "#102342",
    textAlign: "left",
  },
  main: { marginLeft: 250 },
  header: {
    height: 70,
    padding: "0 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "white",
  },
  content: { maxWidth: 1200, margin: "auto", padding: 28 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: 15,
  },
  card: {
    padding: 22,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    marginBottom: 15,
  },
  errorCard: {
    padding: 24,
    background: "white",
    border: "1px solid #f0b8b8",
    borderRadius: 18,
  },
  info: {
    padding: 18,
    background: "#eef5ff",
    border: "1px solid #c9dcf7",
    borderRadius: 14,
    marginBottom: 15,
  },
  number: { display: "block", fontSize: 30, marginTop: 10 },
  accuracyNote: { color: "#64748b", fontSize: 13, lineHeight: 1.6 },
  tools: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 15 },
  table: { overflowX: "auto", background: "white", borderRadius: 16 },
  courseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: 12,
  },
  courseItem: {
    padding: 16,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  center: { minHeight: "100dvh", display: "grid", placeItems: "center" },
}

const responsive = `
  .bdHamb,.bdScrim{display:none}
  .bdSide button{cursor:pointer}
  @media(max-width:800px){
    .bdSide{transform:translateX(-105%);transition:transform .2s;width:min(250px,calc(100vw - 32px))!important}
    .bdSide.open{transform:none}
    .bdMain{margin-left:0!important}
    .bdHamb{display:block}
    .bdScrim{display:block;position:fixed;inset:0;border:0;border-radius:0;background:#09142688;z-index:20}
  }
  @media(max-width:430px){
    .bdMain header{padding:0 12px!important}
    .bdMain>div{padding:18px!important}
  }
  @media(max-height:650px){
    .bdSide{padding-top:12px!important}
    .bdSide h2{font-size:18px;margin:0}
    .bdSide small{font-size:11px}
    .bdSide>div:first-child{gap:4px!important}
    .bdSide>div:first-child>b{padding-block:4px!important}
    .bdSide>div:first-child section{padding:7px!important;gap:3px!important}
    .bdSide nav{padding-block:4px!important;gap:4px!important}
    .bdSide nav button{padding-block:9px!important}
  }
  @media(prefers-reduced-motion:reduce){*{transition:none!important}}
  button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{
    outline:3px solid #ff9a65;
    outline-offset:2px
  }
`
