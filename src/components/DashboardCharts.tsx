import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Book } from "@/lib/bookService";

interface DashboardChartsProps {
  books: Book[];
}

export function DashboardCharts({ books }: DashboardChartsProps) {


  // Author distribution - top 10
  const authorData = books.reduce((acc: Record<string, number>, book) => {
    const author = book.author || "Unknown";
    acc[author] = (acc[author] || 0) + 1;
    return acc;
  }, {});

  const authorChartData = Object.entries(authorData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({
      name: name.length > 15 ? name.substring(0, 12) + "..." : name,
      books: count,
    }));

  // Year distribution
  const yearData = books.reduce((acc: Record<string, number>, book) => {
    const year = book.year || "Unknown";
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  const yearChartData = Object.entries(yearData)
    .sort()
    .map(([name, count]) => ({
      year: String(name),
      count: count,
    }));



  if (books.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available. Import books to see charts.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground font-medium">Total Books</p>
          <p className="text-2xl font-bold text-primary mt-1">{books.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground font-medium">Unique Authors</p>
          <p className="text-2xl font-bold text-primary mt-1">{Object.keys(authorData).length}</p>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        {/* Top Authors Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-border col-span-full">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Authors</h3>
          {authorChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={authorChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="books" fill="#2E7D32" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              No author data available
            </div>
          )}
        </div>

        {/* Publication Year Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-border col-span-full">
          <h3 className="text-sm font-semibold text-foreground mb-4">Books by Publication Year</h3>
          {yearChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yearChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#558B2F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              No year data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
