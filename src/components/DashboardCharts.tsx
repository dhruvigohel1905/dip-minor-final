import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Book } from "@/lib/bookService";

interface DashboardChartsProps {
  books: Book[];
}

export function DashboardCharts({ books }: DashboardChartsProps) {
  // Genre distribution data
  const genreData = books.reduce((acc: Record<string, number>, book) => {
    const genre = book.genre || "Unknown";
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  const genreChartData = Object.entries(genreData).map(([name, count]) => ({
    name,
    value: count,
  }));

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

  const COLORS = [
    "#2E7D32",
    "#558B2F",
    "#9CCC65",
    "#D4E157",
    "#F57F17",
    "#FF6F00",
    "#E65100",
    "#BF360C",
    "#B71C1C",
    "#880E4F",
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground font-medium">Total Books</p>
          <p className="text-2xl font-bold text-primary mt-1">{books.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground font-medium">Genres</p>
          <p className="text-2xl font-bold text-primary mt-1">{genreChartData.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground font-medium">Authors</p>
          <p className="text-2xl font-bold text-primary mt-1">{Object.keys(authorData).length}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Genre Distribution</h3>
          {genreChartData.length > 0 ? (
            <div className="space-y-3">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genreChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genreChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} books`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center">
                {genreChartData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate max-w-[120px]">
                      {entry.name.length > 12 ? entry.name.substring(0, 10) + '...' : entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No genre data available
            </div>
          )}
        </div>

        {/* Top Authors Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-border">
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
