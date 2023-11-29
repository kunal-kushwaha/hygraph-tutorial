import { json, LoaderArgs, LoaderFunction } from "@remix-run/node";
import { gql, GraphQLClient } from "graphql-request";
import styles from "@tremor/react/dist/esm/tremor.css";
import { Card, Title, LineChart } from "@tremor/react";
import { Form, useLoaderData } from "@remix-run/react";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export const loader: LoaderFunction = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  let symbol = url.searchParams.get("symbol");

  if (!symbol) {
    symbol = "IBM";
  }
  const hygraph = new GraphQLClient(process.env.HYGRAPH_URL || "");
  hygraph.setHeader("Authorization", `Bearer ${process.env.API_TOKEN}`);

  const dataQuery = gql`
  query financeAPI($symbol: String!) {
    earnings {
       alphaVantage(symbol: $symbol) {
        annualEarnings {
          reportedEPS
          fiscalDateEnding
        }
      }
    }
  }
  `
  const data: any = await hygraph.request(dataQuery, { symbol: symbol });
  return json({ data: data['earnings'][0]['alphaVantage'], symbol: symbol })
}

export default function Index() {
  const { data, symbol } = useLoaderData<typeof loader>();
  const company = symbol;

  const newchartdata = data['annualEarnings'].map(({ reportedEPS, fiscalDateEnding }: any) => {
    return {
      'reported EPS': parseFloat(reportedEPS),
      fiscalDateEnding: fiscalDateEnding
    }
  }).reverse()

  const earliestDate = newchartdata[0].fiscalDateEnding.split("-")[0]
  const latestDate = newchartdata[newchartdata.length - 1].fiscalDateEnding.split("-")[0]

  // console.log(newchartdata)
  const dataFormatter = (number: number) =>
    `\$${Intl.NumberFormat("us").format(number).toString()}`;


  return (
    <div className="mx-auto w-3/6">
      <Form method="get" className="flex">
        <label htmlFor="symbol" className="sr-only">Search</label>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-5 h-5">
              <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clip-rule="evenodd">
              </path>
            </svg>
          </div>
          <input name="symbol" type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5" placeholder="Input company symbol..." required />
        </div>
        <button type="submit" className="inline-flex items-center py-2.5 px-3 ml-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300">
          Search
        </button>
      </Form>
      <Card marginTop="mt-3">
        <Title>Annual Earnings of {company} ({earliestDate} to {latestDate})</Title>
        <LineChart
          data={newchartdata}
          dataKey="fiscalDateEnding"
          categories={["reported EPS"]}
          colors={["blue"]}
          valueFormatter={dataFormatter}
          marginTop="mt-10"
          yAxisWidth="w-10"
        />
      </Card>
    </div>
  );
}
