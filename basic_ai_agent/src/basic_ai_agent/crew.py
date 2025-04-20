from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from crewai.tools import SerperDevTool
from dotenv import load_dotenv

load_dotenv()


@CrewBase
class BasicAiAgent():
    """BasicAiAgent crew"""

    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    ollama_llm = LLM(
        model='ollama/mistral',
        base_url='http://localhost:11434',
    )

    @agent
    def researcher(self) -> Agent:
        return Agent(
            config=self.agents_config['researcher'],
            verbose=True,
            llm=self.ollama_llm,
        )

    @agent
    def reporting_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['reporting_analyst'],
            verbose=True,
            llm=self.ollama_llm,
        )

    @agent
    def websearcher(self) -> Agent:
        return Agent(
            config=self.agents_config['websearcher'],
            verbose=True,
            tools=[SerperDevTool()],
            llm=self.ollama_llm,
        )
    
    @task
    def web_search_task(self) -> Task:
        return Task(
            config=self.tasks_config['web_search_task'],
            output_file='web_search_results.txt'
        )

    @task
    def research_task(self) -> Task:
        return Task(
            config=self.tasks_config['research_task'],
        )

    @task
    def reporting_task(self) -> Task:
        return Task(
            config=self.tasks_config['reporting_task'],
            output_file='report.md'
        )

    @crew
    def crew(self) -> Crew:
        """Creates the BasicAiAgent crew"""
        # To learn how to add knowledge sources to your crew, check out the documentation:
        # https://docs.crewai.com/concepts/knowledge#what-is-knowledge

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
            # process=Process.hierarchical, # In case you wanna use that instead https://docs.crewai.com/how-to/Hierarchical/
        )
